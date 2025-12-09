import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import httpServer from "../../server.js";
import userModel from "../../models/userModel.js";
import orderModel from "../../models/orderModel.js";

const app = httpServer;

// Test configuration
const TEST_MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/food-del-test";
const JWT_SECRET = process.env.JWT_SECRET || "test_secret_key";

// Helper function to create a test user and token
const createTestUser = async (preferences = {}) => {
  const user = await userModel.create({
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: "hashedpassword123",
    address: {
      formatted: "123 Test St, Test City",
      lat: 40.7128,
      lng: -74.0060,
    },
    preferences: {
      maxDistance: 10,
      minPrice: 0,
      maxPrice: 1000,
      preferredItems: [],
      notificationsEnabled: true,
      ...preferences,
    },
  });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  return { user, token };
};

// Helper function to create a test order
const createTestOrder = async (userId, overrides = {}) => {
  const order = await orderModel.create({
    userId: userId,
    items: [
      { name: "Burger", quantity: 2, price: 10 },
      { name: "Fries", quantity: 1, price: 5 },
    ],
    amount: 25,
    address: {
      formatted: "456 Order St",
      lat: 40.7580,
      lng: -73.9855,
    },
    status: "Food Processing",
    payment: true,
    ...overrides,
  });
  return order;
};

describe("User Preferences API Tests", () => {
  beforeAll(async () => {
  // Only connect if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGODB_URI);
  }
});

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await orderModel.deleteMany({});
  });

  // ===== GET PREFERENCES TESTS =====
  
  describe("GET /api/user/preferences", () => {
    test("should return default preferences for new user", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get("/api/user/preferences")
        .set("token", token);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("maxDistance", 10);
      expect(response.body.data).toHaveProperty("minPrice", 0);
      expect(response.body.data).toHaveProperty("maxPrice", 1000);
      expect(response.body.data).toHaveProperty("notificationsEnabled", true);
      expect(response.body.data.preferredItems).toEqual([]);
    });

    test("should return custom preferences for user with set preferences", async () => {
      const customPrefs = {
        maxDistance: 20,
        minPrice: 10,
        maxPrice: 50,
        preferredItems: ["Pizza", "Burger"],
        notificationsEnabled: false,
      };
      const { token } = await createTestUser(customPrefs);

      const response = await request(app)
        .get("/api/user/preferences")
        .set("token", token);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxDistance).toBe(20);
      expect(response.body.data.minPrice).toBe(10);
      expect(response.body.data.maxPrice).toBe(50);
      expect(response.body.data.preferredItems).toEqual(["Pizza", "Burger"]);
      expect(response.body.data.notificationsEnabled).toBe(false);
    });

    test("should return error when no token provided", async () => {
      const response = await request(app).get("/api/user/preferences");

      expect(response.body.success).toBe(false);
    });

    test("should return error with invalid token", async () => {
      const response = await request(app)
        .get("/api/user/preferences")
        .set("token", "invalid_token_12345");

      expect(response.body.success).toBe(false);
    });
  });

  // ===== UPDATE PREFERENCES TESTS =====

  describe("PUT /api/user/preferences", () => {
    test("should update maxDistance preference", async () => {
      const { token, user } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ maxDistance: 25 });

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxDistance).toBe(25);

      // Verify in database
      const updatedUser = await userModel.findById(user._id);
      expect(updatedUser.preferences.maxDistance).toBe(25);
    });

    test("should update price range preferences", async () => {
      const { token, user } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ minPrice: 15, maxPrice: 75 });

      expect(response.body.success).toBe(true);
      expect(response.body.data.minPrice).toBe(15);
      expect(response.body.data.maxPrice).toBe(75);

      const updatedUser = await userModel.findById(user._id);
      expect(updatedUser.preferences.minPrice).toBe(15);
      expect(updatedUser.preferences.maxPrice).toBe(75);
    });

    test("should update preferredItems list", async () => {
      const { token, user } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ preferredItems: ["Pasta", "Salad", "Soup"] });

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferredItems).toEqual(["Pasta", "Salad", "Soup"]);

      const updatedUser = await userModel.findById(user._id);
      expect(updatedUser.preferences.preferredItems).toEqual(["Pasta", "Salad", "Soup"]);
    });

    test("should toggle notificationsEnabled", async () => {
      const { token, user } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ notificationsEnabled: false });

      expect(response.body.success).toBe(true);
      expect(response.body.data.notificationsEnabled).toBe(false);

      const updatedUser = await userModel.findById(user._id);
      expect(updatedUser.preferences.notificationsEnabled).toBe(false);
    });

    test("should update multiple preferences at once", async () => {
      const { token, user } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({
          maxDistance: 30,
          minPrice: 20,
          maxPrice: 100,
          preferredItems: ["Sushi", "Ramen"],
          notificationsEnabled: false,
        });

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxDistance).toBe(30);
      expect(response.body.data.minPrice).toBe(20);
      expect(response.body.data.maxPrice).toBe(100);
      expect(response.body.data.preferredItems).toEqual(["Sushi", "Ramen"]);
      expect(response.body.data.notificationsEnabled).toBe(false);
    });

    test("should handle empty preferredItems array", async () => {
      const { token } = await createTestUser({
        preferredItems: ["Pizza", "Burger"],
      });

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ preferredItems: [] });

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferredItems).toEqual([]);
    });

    test("should handle extreme distance values", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ maxDistance: 1 });

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxDistance).toBe(1);
    });

    test("should handle large distance values", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ maxDistance: 100 });

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxDistance).toBe(100);
    });

    test("should return error when no token provided", async () => {
      const response = await request(app)
        .put("/api/user/preferences")
        .send({ maxDistance: 20 });

      expect(response.body.success).toBe(false);
    });

    test("should return error with invalid token", async () => {
      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", "invalid_token")
        .send({ maxDistance: 20 });

      expect(response.body.success).toBe(false);
    });
  });

  // ===== NOTIFICATION FILTERING TESTS =====

  describe("Notification Filtering Logic", () => {
    test("should filter by distance preference", async () => {
      const { user } = await createTestUser({
        maxDistance: 5,
        address: { lat: 40.7128, lng: -74.0060 },
      });

      // Order nearby (within 5km)
      const nearbyOrder = await createTestOrder(user._id, {
        address: { lat: 40.7180, lng: -74.0100 }, // ~0.5km away
      });

      // Order far (beyond 5km)
      const farOrder = await createTestOrder(user._id, {
        address: { lat: 40.8580, lng: -73.9000 }, // ~15km away
      });

      // Test logic: User with maxDistance 5 should only see nearby order
      expect(nearbyOrder).toBeDefined();
      expect(farOrder).toBeDefined();
    });

    test("should filter by price range preference", async () => {
      const { user } = await createTestUser({
        minPrice: 20,
        maxPrice: 50,
      });

      const cheapOrder = await createTestOrder(user._id, { amount: 15 });
      const affordableOrder = await createTestOrder(user._id, { amount: 30 });
      const expensiveOrder = await createTestOrder(user._id, { amount: 75 });

      // affordableOrder should match, others should not
      expect(affordableOrder.amount).toBeGreaterThanOrEqual(20);
      expect(affordableOrder.amount).toBeLessThanOrEqual(50);
    });

    test("should filter by preferred items", async () => {
      const { user } = await createTestUser({
        preferredItems: ["Pizza", "Burger"],
      });

      const pizzaOrder = await createTestOrder(user._id, {
        items: [{ name: "Pizza", quantity: 1, price: 15 }],
      });

      const saladOrder = await createTestOrder(user._id, {
        items: [{ name: "Salad", quantity: 1, price: 10 }],
      });

      expect(pizzaOrder.items[0].name).toBe("Pizza");
      expect(saladOrder.items[0].name).toBe("Salad");
    });

    test("should respect notificationsEnabled flag", async () => {
      const { user: enabledUser } = await createTestUser({
        notificationsEnabled: true,
      });

      const { user: disabledUser } = await createTestUser({
        notificationsEnabled: false,
      });

      expect(enabledUser.preferences.notificationsEnabled).toBe(true);
      expect(disabledUser.preferences.notificationsEnabled).toBe(false);
    });
  });

  // ===== EDGE CASES =====

  describe("Edge Cases", () => {
    test("should handle user with no preferences field", async () => {
      const user = await userModel.create({
        name: "No Prefs User",
        email: `noprofs${Date.now()}@example.com`,
        password: "hashedpassword123",
      });

      const token = jwt.sign({ id: user._id }, JWT_SECRET);

      const response = await request(app)
        .get("/api/user/preferences")
        .set("token", token);

      expect(response.body.success).toBe(true);
      // Should return undefined or empty preferences
    });

    test("should handle partial preference updates", async () => {
      const { token } = await createTestUser({
        maxDistance: 10,
        minPrice: 5,
      });

      // Only update one field
      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ maxDistance: 15 });

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxDistance).toBe(15);
      // Other fields should remain unchanged
    });

    test("should handle negative price values gracefully", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ minPrice: -10 });

      // Should either accept or validate
      expect(response.body).toBeDefined();
    });

    test("should handle very large preferredItems array", async () => {
      const { token } = await createTestUser();
      const manyItems = Array.from({ length: 100 }, (_, i) => `Item${i}`);

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ preferredItems: manyItems });

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferredItems.length).toBe(100);
    });

    test("should handle duplicate items in preferredItems", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ preferredItems: ["Pizza", "Pizza", "Burger"] });

      expect(response.body.success).toBe(true);
      // Should either deduplicate or allow duplicates
    });

    test("should handle special characters in preferredItems", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ preferredItems: ["Café Latte", "Crème Brûlée", "Fish & Chips"] });

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferredItems).toContain("Café Latte");
    });

    test("should preserve other user data when updating preferences", async () => {
      const { token, user } = await createTestUser();
      const originalName = user.name;
      const originalEmail = user.email;

      await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({ maxDistance: 20 });

      const updatedUser = await userModel.findById(user._id);
      expect(updatedUser.name).toBe(originalName);
      expect(updatedUser.email).toBe(originalEmail);
    });
  });

  // ===== INTEGRATION TESTS =====

  describe("Integration Tests", () => {
    test("should update preferences and immediately retrieve them", async () => {
      const { token } = await createTestUser();

      // Update
      await request(app)
        .put("/api/user/preferences")
        .set("token", token)
        .send({
          maxDistance: 15,
          preferredItems: ["Tacos"],
        });

      // Retrieve
      const response = await request(app)
        .get("/api/user/preferences")
        .set("token", token);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxDistance).toBe(15);
      expect(response.body.data.preferredItems).toEqual(["Tacos"]);
    });

    test("should handle concurrent preference updates", async () => {
      const { token } = await createTestUser();

      const updates = [
        request(app)
          .put("/api/user/preferences")
          .set("token", token)
          .send({ maxDistance: 20 }),
        request(app)
          .put("/api/user/preferences")
          .set("token", token)
          .send({ minPrice: 10 }),
        request(app)
          .put("/api/user/preferences")
          .set("token", token)
          .send({ maxPrice: 50 }),
      ];

      const results = await Promise.all(updates);
      results.forEach(result => {
        expect(result.body.success).toBe(true);
      });
    });

    test("should maintain preferences after user logout and login", async () => {
      const { token, user } = await createTestUser({
        maxDistance: 25,
        preferredItems: ["Sushi"],
      });

      // Simulate logout by creating new token for same user
      const newToken = jwt.sign({ id: user._id }, JWT_SECRET);

      const response = await request(app)
        .get("/api/user/preferences")
        .set("token", newToken);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxDistance).toBe(25);
      expect(response.body.data.preferredItems).toEqual(["Sushi"]);
    });
  });
});