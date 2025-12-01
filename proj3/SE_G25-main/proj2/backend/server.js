import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import shelterRouter from "./routes/shelterRoute.js";
import { createServer } from "http";
import { Server } from "socket.io";
import rerouteRouter from "./routes/rerouteRoute.js";
import userModel from "./models/userModel.js";
import { calculateDistance } from "./utils/haversine.js";

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
].filter(Boolean);

const app = express();
const port = process.env.PORT || 4000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track connected users
let connectedUsers = new Map(); // socketId -> userId

// Notification queue system
let notificationQueue = [];
let isProcessingNotification = false;
let currentNotificationIndex = 0;
let eligibleUsers = [];
let currentProximityData = []; // NEW: Store proximity data for current notification
let currentNotificationTimeout = null;
let claimedOrders = new Set();

// Configuration: Maximum distance for notifications (in kilometers)
const MAX_NOTIFICATION_DISTANCE_KM = 10;

/**
 * Process notification queue with proximity-based filtering AND user preferences
 * Only notifies users within a certain distance of the order location who match preference criteria
 */
const processNotificationQueue = async () => {
  if (notificationQueue.length > 0 && !isProcessingNotification) {
    isProcessingNotification = true;
    currentNotificationIndex = 0;

    const notification = notificationQueue[0];

    // Skip if order was already claimed
    if (claimedOrders.has(notification.orderId)) {
      console.log(`✅ Order ${notification.orderId} already claimed, skipping notification`);
      notificationQueue.shift();
      isProcessingNotification = false;
      processNotificationQueue();
      return;
    }

    // Get order location coordinates
    const orderLat = notification.orderLocation?.lat;
    const orderLng = notification.orderLocation?.lng;

    if (!orderLat || !orderLng) {
      console.log(`⚠️ No valid location for order ${notification.orderId}, skipping proximity filter`);
      notificationQueue.shift();
      isProcessingNotification = false;
      processNotificationQueue();
      return;
    }

    // Get all connected user IDs
    const connectedUserIds = Array.from(connectedUsers.values());
    
    // Fetch user data with addresses AND preferences from database
    const usersWithAddresses = await userModel
      .find({ _id: { $in: connectedUserIds } })
      .select('_id address preferences')
      .lean();

    // Filter users by proximity AND preferences
    const proximityFilteredUsers = usersWithAddresses
      .filter(user => {
        // Exclude the user who cancelled the order
        if (user._id.toString() === notification.cancelledByUserId) {
          console.log(`   🚫 Excluding user ${user._id} (order canceller)`);
          return false;
        }

        // Check if notifications are enabled
        if (user.preferences?.notificationsEnabled === false) {
          console.log(`   🔕 User ${user._id} has notifications disabled`);
          return false;
        }

        // Check if user has valid coordinates
        if (!user.address || !user.address.lat || !user.address.lng) {
          console.log(`   ⚠️ User ${user._id} has no valid address coordinates`);
          return false;
        }

        // Calculate distance
        const distance = calculateDistance(
          orderLat,
          orderLng,
          user.address.lat,
          user.address.lng
        );

        // Check user's preferred max distance (or use system default)
        const userMaxDistance = user.preferences?.maxDistance || MAX_NOTIFICATION_DISTANCE_KM;
        const isWithinRange = distance <= userMaxDistance;
        
        if (!isWithinRange) {
          console.log(`   ❌ User ${user._id} is ${distance.toFixed(2)} km away (outside their ${userMaxDistance} km preference)`);
          return false;
        }

        // Check price range preferences
        const minPrice = user.preferences?.minPrice || 0;
        const maxPrice = user.preferences?.maxPrice || Infinity;
        const orderAmount = notification.amount || 0;

        if (orderAmount < minPrice || orderAmount > maxPrice) {
          console.log(`   💰 Order $${orderAmount} outside user ${user._id}'s price range ($${minPrice}-$${maxPrice})`);
          return false;
        }

        // Check preferred items (if user has any preferences)
        const preferredItems = user.preferences?.preferredItems || [];
        if (preferredItems.length > 0) {
          const orderItemNames = (notification.orderItems || []).map(item => 
            item.name?.toLowerCase()
          );
          
          const hasPreferredItem = preferredItems.some(prefItem => 
            orderItemNames.some(orderItem => 
              orderItem?.includes(prefItem.toLowerCase())
            )
          );

          if (!hasPreferredItem) {
            console.log(`   🍽️ User ${user._id} has item preferences but order doesn't match`);
            return false;
          }
        }

        console.log(`   ✅ User ${user._id} is ${distance.toFixed(2)} km away and matches all preferences`);
        return true;
      })
      .map(user => ({
        userId: user._id.toString(),
        distance: calculateDistance(
          orderLat,
          orderLng,
          user.address.lat,
          user.address.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance); // Sort by closest first

    // Store proximity data at module level for use in showNotificationToNextUser
    currentProximityData = proximityFilteredUsers;

    // Map user IDs to socket IDs
    eligibleUsers = proximityFilteredUsers
      .map(({ userId }) => {
        // Find socket ID for this user
        for (const [socketId, uid] of connectedUsers.entries()) {
          if (uid === userId) {
            return socketId;
          }
        }
        return null;
      })
      .filter(socketId => socketId !== null);

    console.log(`\n📢 Processing notification for order ${notification.orderId}`);
    console.log(`📍 Order location: ${orderLat}, ${orderLng}`);
    console.log(`📊 Total connected users: ${connectedUsers.size}`);
    console.log(`📊 Order cancelled by userId: ${notification.cancelledByUserId}`);
    console.log(`📏 Maximum notification distance: ${MAX_NOTIFICATION_DISTANCE_KM} km`);
    console.log(`✅ Eligible users (after all filters): ${eligibleUsers.length}`);
    
    if (eligibleUsers.length > 0) {
      console.log(`📤 Notifying users (sorted by proximity):`);
      eligibleUsers.forEach((socketId, idx) => {
        const userId = connectedUsers.get(socketId);
        const userInfo = proximityFilteredUsers.find(u => u.userId === userId);
        console.log(`   ${idx + 1}. Socket ${socketId} → User ${userId} (${userInfo?.distance.toFixed(2)} km away)`);
      });
    }

    if (eligibleUsers.length === 0) {
      console.log(`⚠️ No eligible users match preferences - removing from queue`);
      notificationQueue.shift();
      isProcessingNotification = false;
      processNotificationQueue();
      return;
    }

    showNotificationToNextUser(notification);
  }
};

/**
 * Show notification to next user in sequence
 * Each user gets 7 seconds before moving to next user
 */
const showNotificationToNextUser = (notification) => {
  // Check if order was claimed before showing to next user
  if (claimedOrders.has(notification.orderId)) {
    console.log(`✅ Order ${notification.orderId} was claimed, stopping queue`);
    notificationQueue.shift();
    isProcessingNotification = false;
    processNotificationQueue();
    return;
  }

  if (currentNotificationIndex < eligibleUsers.length) {
    const socketId = eligibleUsers[currentNotificationIndex];
    const userId = connectedUsers.get(socketId);

    // Get distance for this user from stored proximity data
    const userProximityInfo = currentProximityData.find(u => u.userId === userId);
    const distanceKm = userProximityInfo?.distance;

    console.log(`📨 Sending notification ${currentNotificationIndex + 1}/${eligibleUsers.length} to user ${userId} (socket ${socketId})`);
    if (distanceKm !== undefined) {
      console.log(`   📏 Distance: ${distanceKm.toFixed(2)} km`);
    }

    // Send to specific user only, including distance
    io.to(socketId).emit("orderCancelled", {
      ...notification,
      distanceKm: distanceKm // Include distance in notification
    });

    currentNotificationIndex++;

    // Wait 7 seconds before showing to next user
    currentNotificationTimeout = setTimeout(() => {
      showNotificationToNextUser(notification);
    }, 7000);
  } else {
    // All users have been notified
    console.log(`✅ All ${eligibleUsers.length} eligible users notified for order ${notification.orderId}`);
    notificationQueue.shift();
    isProcessingNotification = false;
    
    // Clear proximity data
    currentProximityData = [];
    
    processNotificationQueue();
  }
};

/**
 * Stop notification queue for a specific order (when someone claims it)
 */
const stopNotificationForOrder = (orderId) => {
  console.log(`🛑 Stopping notifications for order ${orderId}`);
  claimedOrders.add(orderId);

  // Clear the current timeout if it exists
  if (currentNotificationTimeout) {
    clearTimeout(currentNotificationTimeout);
    currentNotificationTimeout = null;
  }

  // Remove from queue if it's the current notification
  if (isProcessingNotification && notificationQueue.length > 0) {
    const currentNotification = notificationQueue[0];
    if (currentNotification.orderId === orderId) {
      notificationQueue.shift();
      isProcessingNotification = false;
      
      // Clear proximity data
      currentProximityData = [];
      
      processNotificationQueue();
    }
  }
};

/**
 * Add notification to queue
 * IMPORTANT: This can be called multiple times for the same order (redistribution)
 * Each call will send fresh notifications to all eligible users within proximity
 */
const queueNotification = (notification) => {
  console.log(`➕ Queuing notification for order ${notification.orderId}`);
  console.log(`   Redistribution #${notification.redistributionCount || 1}`);
  
  // Remove order from claimed set if it's being redistributed again
  if (claimedOrders.has(notification.orderId)) {
    console.log(`🔄 Removing order ${notification.orderId} from claimed set (redistribution)`);
    claimedOrders.delete(notification.orderId);
  }
  
  notificationQueue.push(notification);
  processNotificationQueue();
};

// Make functions available to routes
app.set("socketio", io);
app.set("queueNotification", queueNotification);
app.set("stopNotificationForOrder", stopNotificationForOrder);

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Store userId when user connects
  socket.on("register", (userId) => {
    connectedUsers.set(socket.id, userId);
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    console.log(`📊 Total connected users: ${connectedUsers.size}`);
  });

  // Handle order claim
  socket.on("claimOrder", (data) => {
    const { orderId, userId } = data;
    console.log(`🎯 User ${userId} claimed order ${orderId}`);

    // Stop showing notification to other users
    stopNotificationForOrder(orderId);

    // Broadcast to all users that order was claimed
    io.emit("orderClaimed", { orderId, userId });
  });

  socket.on("disconnect", () => {
    const userId = connectedUsers.get(socket.id);
    console.log(`❌ User disconnected: ${socket.id} (User ${userId})`);
    connectedUsers.delete(socket.id);
    console.log(`📊 Total connected users: ${connectedUsers.size}`);
  });
});

app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/user", userRouter);
app.use("/api/food", foodRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/shelters", shelterRouter);
app.use("/api/reroutes", rerouteRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

httpServer.listen(port, () =>
  console.log(`Server started on http://localhost:${port}`)
);