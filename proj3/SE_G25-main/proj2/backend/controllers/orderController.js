import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import shelterModel from "../models/shelterModel.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import rerouteModel from "../models/rerouteModel.js";

// config variables
const currency = "usd";
const deliveryCharge = 5;
const frontend_URL = "http://localhost:5173";

// Status constants & FSM rules
const STATUS = {
  PROCESSING: "Food Processing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  REDISTRIBUTE: "Redistribute",
  CANCELLED: "Cancelled",
  DONATED: "Donated",
};

const STATUS_VALUES = new Set(Object.values(STATUS));

/**
 * Allowed transitions for ADMIN:
 * - Food Processing -> Out for delivery, Delivered
 * - Out for delivery -> Delivered
 * - Redistribute -> Cancelled, Donated
 * - Cancelled -> Redistribute, Donated
 * - Delivered -> (terminal)
 * - Donated -> (terminal)
 */
const ADMIN_ALLOWED_TRANSITIONS = {
  [STATUS.PROCESSING]: new Set([STATUS.OUT_FOR_DELIVERY, STATUS.DELIVERED]),
  [STATUS.OUT_FOR_DELIVERY]: new Set([STATUS.DELIVERED]),
  [STATUS.REDISTRIBUTE]: new Set([STATUS.CANCELLED, STATUS.DONATED]),
  [STATUS.CANCELLED]: new Set([STATUS.REDISTRIBUTE, STATUS.DONATED]),
  [STATUS.DONATED]: new Set(),
  [STATUS.DELIVERED]: new Set(),
};

/**
 * Checks if a status transition is allowed for admin
 * @param {string} from - Current order status
 * @param {string} to - Desired order status
 * @param {boolean} cancelledByUser - Whether order was cancelled by user
 * @returns {boolean} True if transition is allowed
 */
function canAdminTransition(from, to, cancelledByUser = false) {
  if (from === to) return true;
  
  // If user cancelled the order, admin can only set to Redistribute or Donated
  if (cancelledByUser && from === STATUS.CANCELLED) {
    return to === STATUS.REDISTRIBUTE || to === STATUS.DONATED;
  }
  
  const nexts = ADMIN_ALLOWED_TRANSITIONS[from] || new Set();
  return nexts.has(to);
}

/**
 * Cancels an order (USER ACTION)
 * Marks order as cancelled by user and sets status to Cancelled
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    if (order.userId !== userId && order.claimedBy !== userId)
      return res.json({ success: false, message: "Unauthorized" });

    const current = order.status || STATUS.PROCESSING;
    const userCancelable = new Set([
      STATUS.PROCESSING,
      STATUS.OUT_FOR_DELIVERY,
    ]);
    
    if (!userCancelable.has(current))
      return res.json({
        success: false,
        message: `Cannot cancel when status is "${current}".`,
      });

    // Mark as cancelled by user
    order.status = STATUS.CANCELLED;
    order.cancelledByUser = true;
    
    // Preserve original user ID for filtering notifications
    if (!order.originalUserId) {
      order.originalUserId = order.userId;
    }
    
    await order.save();

    console.log(`❌ Order ${orderId} cancelled by user ${userId}`);

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.error("cancelOrder error:", error);
    res.json({ success: false, message: "Error cancelling order" });
  }
};

/**
 * Allows a user to claim a redistributed order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const claimOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const claimerId = req.body.userId;

    const order = await orderModel.findById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    if (order.status !== STATUS.REDISTRIBUTE)
      return res.json({
        success: false,
        message: "Order not available for claim",
      });

    // Preserve original user
    if (!order.originalUserId) order.originalUserId = order.userId;

    // Transfer ownership
    order.userId = claimerId;
    order.claimedBy = claimerId;
    order.claimedAt = new Date();
    order.status = STATUS.PROCESSING;
    order.cancelledByUser = false; // Reset since it's now claimed

    await order.save();

    // Stop notifications for this order
    const stopNotificationForOrder = req.app.get("stopNotificationForOrder");
    if (typeof stopNotificationForOrder === "function") {
      stopNotificationForOrder(orderId);
    }

    res.json({
      success: true,
      message: "Order claimed successfully; it is now in Food Processing.",
      data: order,
    });
  } catch (error) {
    console.error("claimOrder error:", error);
    res.json({ success: false, message: "Error claiming order" });
  }
};

/**
 * Places a new order with Stripe payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const placeOrder = async (req, res) => {
  try {
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    res.json({
      success: true,
      session_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error });
  }
};

/**
 * Places a new order with Cash on Delivery
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const placeOrderCod = async (req, res) => {
  try {
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
      payment: true,
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });
    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

/**
 * Retrieves all orders from the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

/**
 * Retrieves all orders for a specific user
 * Rules:
 * - Shows orders created by the user
 * - Shows orders claimed by the user
 * - DOES NOT show orders that were cancelled by user and then claimed by someone else
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
/**
 * Retrieves all orders for a specific user
 * Rules:
 * - Shows orders created by the user (that haven't been claimed by others)
 * - Shows orders claimed by the user
 * - DOES NOT show orders that were cancelled by user and then claimed by someone else
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
/**
 * Retrieves all orders for a specific user
 * Rules:
 * - Shows orders originally created by the user (even if claimed by others)
 * - Shows orders claimed by the user (that they didn't originally create)
 * - Original user sees their cancelled orders as "Cancelled" even after someone claims them
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const userOrders = async (req, res) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    const orders = await orderModel
      .find({
        $or: [
          // Orders I originally created (show even if claimed by others)
          { originalUserId: userId },
          // Orders where I'm the original user and no one claimed yet
          { userId: userId, originalUserId: null },
          // Orders I claimed from others (but didn't originally create)
          { 
            claimedBy: userId, 
            originalUserId: { $ne: userId },
            userId: userId 
          }
        ],
      })
      .sort({ date: -1 });
      
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("userOrders error:", error);
    res.json({ success: false, message: "Error fetching orders" });
  }
};

/**
 * Updates the status of an order (ADMIN ACTION)
 * Handles redistribution with socket notifications via queue system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateStatus = async (req, res) => {
  try {
    const { orderId, status: next } = req.body;

    if (!STATUS_VALUES.has(next))
      return res.json({ success: false, message: "Invalid status value" });

    const order = await orderModel.findById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    const current = order.status || STATUS.PROCESSING;
    
    if (current === next)
      return res.json({
        success: true,
        message: "Status unchanged",
        data: order,
      });

    // Check if admin can make this transition
    if (!canAdminTransition(current, next, order.cancelledByUser)) {
      const allowed = [...(ADMIN_ALLOWED_TRANSITIONS[current] || [])];
      return res.json({
        success: false,
        message:
          `Illegal transition: "${current}" → "${next}". ` +
          `Allowed: ${allowed.length ? allowed.join(", ") : "none"}`,
      });
    }

    // Special handling for Redistribute status
    if (next === STATUS.REDISTRIBUTE) {
      // Update redistribution tracking
      order.redistributionCount = (order.redistributionCount || 0) + 1;
      order.lastRedistributedAt = new Date();
      order.status = STATUS.REDISTRIBUTE;
      await order.save();

      // Queue notification using existing system
      const queueNotification = req.app.get("queueNotification");
      if (typeof queueNotification === "function") {
        const originalUserId = order.originalUserId || order.userId;
        queueNotification({
          orderId: order._id.toString(),
          orderItems: order.items,
          cancelledByUserId: originalUserId,
          message: "An order is available for claiming!",
          amount: order.amount,
          address: order.address,
        });
        console.log(`📢 Queued claiming notifications for order ${orderId}`);
      }

      // NO AUTO-TRANSITION - Order stays in Redistribute until:
      // 1. Someone claims it (moves to Processing)
      // 2. Admin manually changes it to Cancelled or Donated

      return res.json({
        success: true,
        message: "Claiming notifications sent to users.",
        data: order,
      });
    }

    // Regular status update
    order.status = next;
    await order.save();
    
    return res.json({ success: true, message: "Status Updated", data: order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating status" });
  }
};

/**
 * Verifies payment status after Stripe checkout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    res.json({ success: false, message: "Not Verified" });
  }
};

/**
 * Assigns a cancelled or redistributed order to a shelter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const assignShelter = async (req, res) => {
  try {
    const { orderId, shelterId } = req.body;

    if (!orderId || !shelterId)
      return res.json({
        success: false,
        message: "orderId and shelterId are required",
      });

    const order = await orderModel.findById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    const shelter = await shelterModel.findById(shelterId);
    if (!shelter)
      return res.json({ success: false, message: "Shelter not found" });

    const current = order.status || STATUS.PROCESSING;
    if (current !== STATUS.REDISTRIBUTE && current !== STATUS.CANCELLED)
      return res.json({
        success: false,
        message: `Order status is "${current}". Only "Redistribute" or "Cancelled" can be assigned.`,
      });

    if (order.shelter && order.shelter.id)
      return res.json({
        success: true,
        alreadyAssigned: true,
        message: "Order already assigned to a shelter",
        data: order,
      });

    // Move to DONATED state
    order.status = STATUS.DONATED;
    order.shelter = {
      id: shelter._id.toString(),
      name: shelter.name,
      contactEmail: shelter.contactEmail,
      contactPhone: shelter.contactPhone,
      address: shelter.address,
    };
    order.donationNotified = false;

    await order.save();

    // Stop notifications for this order if any
    const stopNotificationForOrder = req.app.get("stopNotificationForOrder");
    if (typeof stopNotificationForOrder === "function") {
      stopNotificationForOrder(orderId);
    }

    await rerouteModel.create({
      orderId: order._id,
      restaurantId: order.restaurantId ?? undefined,
      restaurantName: order.restaurantName ?? undefined,
      shelterId: shelter._id,
      shelterName: shelter.name,
      shelterAddress: shelter.address,
      shelterContactEmail: shelter.contactEmail,
      shelterContactPhone: shelter.contactPhone,
      items: (order.items || []).map((it) => ({
        name: it.name,
        qty: it.quantity ?? it.qty ?? 1,
        price: it.price,
      })),
      total: order.amount ?? order.total,
    });

    return res.json({
      success: true,
      message: "Order assigned to shelter and marked as donated",
      data: order,
    });
  } catch (err) {
    console.log("assignShelter error:", err);
    return res.json({ success: false, message: "Error assigning shelter" });
  }
};

export {
  placeOrder,
  listOrders,
  userOrders,
  updateStatus,
  verifyOrder,
  placeOrderCod,
  cancelOrder,
  assignShelter,
  claimOrder,
};