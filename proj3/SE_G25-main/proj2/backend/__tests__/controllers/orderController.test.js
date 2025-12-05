import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// =====================================================================
// 1. MOCKING PHASE
// =====================================================================

// --- Mock Order Model (Constructor + Statics) ---
await jest.unstable_mockModule("../../models/orderModel.js", () => {
  // 1. Create the mock instance methods (like .save())
  const mockInstance = {
    save: jest.fn(),
  };

  // 2. Create the Mock Constructor Function
  // When 'new orderModel()' is called, it returns mockInstance
  const MockConstructor = jest.fn(() => mockInstance);

  // 3. Attach Static Methods to the Constructor
  MockConstructor.find = jest.fn();
  MockConstructor.findById = jest.fn();
  MockConstructor.findByIdAndUpdate = jest.fn();
  MockConstructor.findByIdAndDelete = jest.fn();
  
  // Helper to access the instance mock from tests
  MockConstructor.mockInstance = mockInstance;

  return {
    default: MockConstructor
  };
});

// --- Define reusable User Mock logic for .select() chaining ---
const mockUserWithSelect = () => ({
  select: jest.fn().mockResolvedValue({ 
    _id: "user1", 
    address: { lat: 10, lng: 10 } 
  })
});

// --- Mock User Model ---
await jest.unstable_mockModule("../../models/userModel.js", () => ({
  default: {
    // Default behavior supports chaining: findById().select()
    findById: jest.fn(() => mockUserWithSelect()),
    findByIdAndUpdate: jest.fn(),
  }
}));

// --- Mock Food Model ---
await jest.unstable_mockModule("../../models/foodModel.js", () => ({
  default: {
    findById: jest.fn(),
  }
}));

// --- Mock Shelter Model ---
await jest.unstable_mockModule("../../models/shelterModel.js", () => ({
  default: {
    findById: jest.fn(),
  }
}));

// --- Mock Reroute Model ---
await jest.unstable_mockModule("../../models/rerouteModel.js", () => ({
  default: {
    create: jest.fn(),
  }
}));

// --- Mock Stripe ---
await jest.unstable_mockModule("stripe", () => ({
  default: jest.fn(() => ({
    checkout: { sessions: { create: jest.fn(() => ({ url: "http://fake-session-url" })) } }
  }))
}));

// =====================================================================
// 2. IMPORT PHASE
// =====================================================================
const { 
  placeOrder, 
  placeOrderCod,
  verifyOrder, 
  userOrders, 
  listOrders, 
  updateStatus, 
  cancelOrder, 
  claimOrder,
  assignShelter
} = await import("../../controllers/orderController.js");

const orderModel = (await import("../../models/orderModel.js")).default;
const userModel = (await import("../../models/userModel.js")).default;
const foodModel = (await import("../../models/foodModel.js")).default;
const shelterModel = (await import("../../models/shelterModel.js")).default;
const rerouteModel = (await import("../../models/rerouteModel.js")).default;

// =====================================================================
// 3. TEST SUITE
// =====================================================================
describe("Order Controller - Full Suite", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      app: { get: jest.fn() }, // Mock req.app.get for socket functions
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();

    // RESTORE MOCKS: Ensure userModel always has the .select() structure by default
    userModel.findById.mockImplementation(() => mockUserWithSelect());
    
    // Reset orderModel static returns
    orderModel.find.mockReset();
    orderModel.findById.mockReset();
  });

  // --- 1. placeOrder (Stripe) ---
  describe("placeOrder", () => {
    it("should place stripe order successfully", async () => {
      req.body = {
        userId: "user1",
        items: [{ _id: "food1", quantity: 1 }],
        amount: 50,
        address: { street: "123 Main" }
      };

      // foodModel returns item (not surplus, simple path)
      foodModel.findById.mockResolvedValue({ _id: "food1", isSurplus: false });
      
      await placeOrder(req, res);

      // Check if the constructor was called
      expect(orderModel).toHaveBeenCalledTimes(1);
      // Check if .save() was called on the instance
      expect(orderModel.mockInstance.save).toHaveBeenCalled();
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // --- 2. placeOrderCod (Cash) ---
  describe("placeOrderCod", () => {
    it("should place COD order successfully", async () => {
      req.body = {
        userId: "user1",
        items: [{ _id: "food1", quantity: 1 }],
        amount: 50,
        address: { street: "123 Main" }
      };

      foodModel.findById.mockResolvedValue({ _id: "food1", isSurplus: false });

      await placeOrderCod(req, res);

      expect(orderModel).toHaveBeenCalledTimes(1);
      expect(orderModel.mockInstance.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Order Placed" });
    });
  });

  // --- 3. verifyOrder ---
  describe("verifyOrder", () => {
    it("should verify order payment successfully", async () => {
      req.body = { orderId: "order1", success: "true" };
      orderModel.findByIdAndUpdate.mockResolvedValue(true);

      await verifyOrder(req, res);

      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith("order1", { payment: true });
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Paid" });
    });

    it("should delete order if payment failed", async () => {
      req.body = { orderId: "order1", success: "false" };
      orderModel.findByIdAndDelete.mockResolvedValue(true);

      await verifyOrder(req, res);

      expect(orderModel.findByIdAndDelete).toHaveBeenCalledWith("order1");
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Not Paid" });
    });
  });

  // --- 4. userOrders ---
  describe("userOrders", () => {
    it("should fetch user orders", async () => {
      req.body = { userId: "user1" };
      
      // FIX: Add 'status' and other likely required fields to the mock
      const mockOrders = [{ 
        _id: "order1", 
        userId: "user1", 
        status: "Food Processing", // Essential if controller filters by status
        items: [],
        amount: 50
      }];
      
      // Mock chaining: find().sort()
      // This ensures that when the controller calls .sort(), it receives the array
      const sortMock = jest.fn().mockResolvedValue(mockOrders);
      orderModel.find.mockReturnValue({ sort: sortMock });

      await userOrders(req, res);

      // Verify the query contained the userId
      expect(orderModel.find).toHaveBeenCalledWith(expect.objectContaining({ 
        $or: expect.arrayContaining([{ userId: "user1" }]) 
      }));
      
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockOrders });
    });
  });

  // --- 5. listOrders ---
  describe("listOrders", () => {
    it("should list all orders", async () => {
      const mockOrders = [{ _id: "order1" }, { _id: "order2" }];
      
      // Mock chaining: find().sort()
      const sortMock = jest.fn().mockResolvedValue(mockOrders);
      orderModel.find.mockReturnValue({ sort: sortMock });

      await listOrders(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockOrders });
    });
  });

  // --- 6. updateStatus ---
  describe("updateStatus", () => {
    it("should update status successfully", async () => {
      req.body = { orderId: "order1", status: "Out for delivery" };
      
      const saveMock = jest.fn();
      const mockOrder = {
        _id: "order1",
        status: "Food Processing",
        save: saveMock
      };

      orderModel.findById.mockResolvedValue(mockOrder);

      await updateStatus(req, res);

      expect(mockOrder.status).toBe("Out for delivery");
      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // --- 7. claimOrder ---
  describe("claimOrder", () => {
    it("should successfully claim an order", async () => {
      req.body = { orderId: "order1", userId: "user2" };
      
      const saveMock = jest.fn();
      const mockOrder = {
        _id: "order1",
        status: "Redistribute",
        userId: "user1",
        save: saveMock
      };

      orderModel.findById.mockResolvedValue(mockOrder);
      
      // OVERRIDE for this test: findById needs to return a user object directly
      // (claimOrder uses await userModel.findById(), NOT .select())
      userModel.findById.mockResolvedValue({ 
        _id: "user2", 
        address: { lat: 10, lng: 10 } 
      });

      await claimOrder(req, res);

      expect(mockOrder.userId).toBe("user2");
      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // --- 8. cancelOrder ---
  describe("cancelOrder", () => {
    it("should cancel order successfully", async () => {
      req.body = { orderId: "order1", userId: "user1" };

      const saveMock = jest.fn();
      const mockOrder = {
        _id: "order1",
        userId: "user1",
        status: "Food Processing",
        save: saveMock
      };

      orderModel.findById.mockResolvedValue(mockOrder);

      await cancelOrder(req, res);

      expect(mockOrder.status).toBe("Cancelled");
      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // --- 9. assignShelter ---
  describe("assignShelter", () => {
    it("should successfully assign an order to a shelter", async () => {
      req.body = { orderId: "order1", shelterId: "shelter1" };

      const saveMock = jest.fn();
      const mockOrder = {
        _id: "order1",
        status: "Redistribute",
        amount: 50,
        items: [{ name: "Food", quantity: 1, price: 50 }],
        save: saveMock
      };

      const mockShelter = {
        _id: "shelter1",
        name: "Hope Shelter",
        address: "123 Hope St",
        contactEmail: "test@shelter.com",
        contactPhone: "1234567890"
      };

      orderModel.findById.mockResolvedValue(mockOrder);
      shelterModel.findById.mockResolvedValue(mockShelter);
      rerouteModel.create.mockResolvedValue(true);

      await assignShelter(req, res);

      expect(mockOrder.status).toBe("Donated");
      expect(saveMock).toHaveBeenCalled();
      expect(rerouteModel.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

});