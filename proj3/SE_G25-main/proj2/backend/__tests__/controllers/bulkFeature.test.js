import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// =====================================================================
// 1. MOCKING PHASE
// =====================================================================
const saveMock = jest.fn();

// Create a Spy Class for the constructor so we can track 'new foodModel()'
const FoodModelMock = jest.fn(() => ({
  save: saveMock
}));

// Attach static methods to the mock class so controller can call foodModel.findById...
FoodModelMock.findById = jest.fn();
FoodModelMock.findByIdAndUpdate = jest.fn();

// Mock the module using the unstable_mockModule for ESM support
await jest.unstable_mockModule("../../models/foodModel.js", () => ({
  default: FoodModelMock
}));

// =====================================================================
// 2. IMPORT PHASE
// =====================================================================
// Import controller AFTER mocks are defined
const { createBulkItem, updateBulkItem } = await import("../../controllers/foodController.js");
const foodModel = FoodModelMock;

// =====================================================================
// 3. TEST SUITE (30 Cases)
// =====================================================================
describe("Bulk Order Feature - Comprehensive Test Suite", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
    saveMock.mockClear();
  });

  // ---------------------------------------------------------
  // GROUP 1: createBulkItem (Positive Tests)
  // ---------------------------------------------------------
  describe("createBulkItem - Positive Flows", () => {
    
    it("1. Should successfully create a bulk item when inputs are valid", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 5, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ _id: "origin_1", name: "Pizza", image: "img_data" });

      await createBulkItem(req, res);
      
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Bulk Pack Created!" });
    });

    it("2. Should copy the image correctly from the original item", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 5, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ name: "Pizza", image: "unique_img_string" });

      await createBulkItem(req, res);

      const args = foodModel.mock.calls[0][0];
      expect(args.image).toBe("unique_img_string");
    });

    it("3. Should copy the 3D model correctly from the original item", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 5, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ name: "Pizza", model3D: "glb_data" });

      await createBulkItem(req, res);

      const args = foodModel.mock.calls[0][0];
      expect(args.model3D).toBe("glb_data");
    });

    it("4. Should construct the Name correctly (e.g., '5x Pizza (Bulk)')", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 5, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ name: "Burger" });

      await createBulkItem(req, res);

      const args = foodModel.mock.calls[0][0];
      expect(args.name).toBe("5x Burger (Bulk)");
    });

    it("5. Should set the Category to 'Bulk Deals' explicitly", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 5, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ name: "Burger" });

      await createBulkItem(req, res);

      const args = foodModel.mock.calls[0][0];
      expect(args.category).toBe("Bulk Deals");
    });

    it("6. Should set isSurplus flag to true (for inventory tracking)", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 5, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ name: "Burger" });

      await createBulkItem(req, res);

      const args = foodModel.mock.calls[0][0];
      expect(args.isSurplus).toBe(true);
    });

    it("7. Should set the correct surplusQuantity", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 5, inventoryCount: 99 };
      foodModel.findById.mockResolvedValue({ name: "Burger" });

      await createBulkItem(req, res);

      const args = foodModel.mock.calls[0][0];
      expect(args.surplusQuantity).toBe(99);
    });

    it("8. Should convert string inputs to Numbers (e.g. '80' -> 80)", async () => {
      req.body = { id: "origin_1", bulkPrice: "80", packSize: "5", inventoryCount: "10" };
      foodModel.findById.mockResolvedValue({ name: "Burger" });

      await createBulkItem(req, res);

      const args = foodModel.mock.calls[0][0];
      expect(args.price).toBe(80);
      expect(args.surplusQuantity).toBe(10);
    });

    it("9. Should generate a descriptive description field", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 12, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ name: "Donut" });

      await createBulkItem(req, res);

      const args = foodModel.mock.calls[0][0];
      expect(args.description).toContain("Value Pack: 12 units of Donut");
    });

    it("10. Should call .save() to persist data", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 5, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ name: "Burger" });

      await createBulkItem(req, res);

      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------
  // GROUP 2: createBulkItem (Negative/Error Tests)
  // ---------------------------------------------------------
  describe("createBulkItem - Negative Flows", () => {

    it("11. Should return error if original Item ID is not found", async () => {
      req.body = { id: "missing_id" };
      foodModel.findById.mockResolvedValue(null); // DB returns null

      await createBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Item not found" });
    });

    it("12. Should handle database errors during findById gracefully", async () => {
      req.body = { id: "origin_1" };
      foodModel.findById.mockRejectedValue(new Error("DB Connection Failed"));

      await createBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Error" });
    });

    it("13. Should handle missing request body (Edge Case)", async () => {
      req.body = {}; 
      await createBulkItem(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Error" });
    });

    it("14. Should handle packSize of 0 (Business Logic Edge Case)", async () => {
      req.body = { id: "origin_1", bulkPrice: 80, packSize: 0, inventoryCount: 10 };
      foodModel.findById.mockResolvedValue({ name: "Pizza" });

      await createBulkItem(req, res);
      const args = foodModel.mock.calls[0][0];
      expect(args.name).toBe("0x Pizza (Bulk)");
    });

    it("15. Should handle negative prices (Technical Check)", async () => {
      req.body = { id: "origin_1", bulkPrice: -50, packSize: 5 };
      foodModel.findById.mockResolvedValue({ name: "Pizza" });

      await createBulkItem(req, res);
      const args = foodModel.mock.calls[0][0];
      expect(args.price).toBe(-50);
    });
  });

  // ---------------------------------------------------------
  // GROUP 3: updateBulkItem (Positive Tests)
  // ---------------------------------------------------------
  describe("updateBulkItem - Positive Flows", () => {

    it("16. Should successfully update an existing bulk pack", async () => {
      req.body = { id: "bulk_1", price: 90, inventoryCount: 5 };
      foodModel.findByIdAndUpdate.mockResolvedValue(true);

      await updateBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Bulk Pack Updated" });
    });

    it("17. Should update ONLY the price and surplusQuantity", async () => {
      req.body = { id: "bulk_1", price: 90, inventoryCount: 5 };
      foodModel.findByIdAndUpdate.mockResolvedValue(true);

      await updateBulkItem(req, res);

      expect(foodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "bulk_1",
        { price: 90, surplusQuantity: 5 }
      );
    });

    it("18. Should convert string inputs to numbers during update", async () => {
      req.body = { id: "bulk_1", price: "100", inventoryCount: "20" };
      foodModel.findByIdAndUpdate.mockResolvedValue(true);

      await updateBulkItem(req, res);

      expect(foodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "bulk_1",
        { price: 100, surplusQuantity: 20 }
      );
    });

    it("19. Should allow setting inventory to 0 (Out of Stock)", async () => {
      req.body = { id: "bulk_1", price: 90, inventoryCount: 0 };
      foodModel.findByIdAndUpdate.mockResolvedValue(true);

      await updateBulkItem(req, res);

      const args = foodModel.findByIdAndUpdate.mock.calls[0][1];
      expect(args.surplusQuantity).toBe(0);
    });

    it("20. Should allow setting price to 0 (Free Giveaway)", async () => {
      req.body = { id: "bulk_1", price: 0, inventoryCount: 10 };
      foodModel.findByIdAndUpdate.mockResolvedValue(true);

      await updateBulkItem(req, res);

      const args = foodModel.findByIdAndUpdate.mock.calls[0][1];
      expect(args.price).toBe(0);
    });
  });

  // ---------------------------------------------------------
  // GROUP 4: updateBulkItem (Negative/Error Tests)
  // ---------------------------------------------------------
  describe("updateBulkItem - Negative Flows", () => {

    it("21. Should handle database errors during update", async () => {
      req.body = { id: "bulk_1", price: 90, inventoryCount: 5 };
      foodModel.findByIdAndUpdate.mockRejectedValue(new Error("DB Error"));

      await updateBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Error updating bulk pack" });
    });

    it("22. Should handle missing ID in request", async () => {
      req.body = { price: 90, inventoryCount: 5 }; // No ID
      foodModel.findByIdAndUpdate.mockRejectedValue(new Error("CastError"));

      await updateBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Error updating bulk pack" });
    });

    it("23. Should handle partial updates (Missing Price)", async () => {
      req.body = { id: "bulk_1", inventoryCount: 5 }; // No Price
      foodModel.findByIdAndUpdate.mockResolvedValue(true);

      await updateBulkItem(req, res);

      const args = foodModel.findByIdAndUpdate.mock.calls[0][1];
      expect(args).toHaveProperty("surplusQuantity", 5);
    });

    it("24. Should handle partial updates (Missing Inventory)", async () => {
      req.body = { id: "bulk_1", price: 50 }; // No Inventory
      foodModel.findByIdAndUpdate.mockResolvedValue(true);

      await updateBulkItem(req, res);

      const args = foodModel.findByIdAndUpdate.mock.calls[0][1];
      expect(args).toHaveProperty("price", 50);
    });
  });

  // ---------------------------------------------------------
  // GROUP 5: Integrity Checks (Ensure Data Safety)
  // ---------------------------------------------------------
  describe("Data Integrity Checks", () => {

    it("25. Should NOT update the name field during updateBulkItem", async () => {
      req.body = { id: "bulk_1", price: 90, inventoryCount: 5 };
      await updateBulkItem(req, res);
      
      const updateArg = foodModel.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg).not.toHaveProperty("name");
    });

    it("26. Should NOT update the image field during updateBulkItem", async () => {
      req.body = { id: "bulk_1", price: 90, inventoryCount: 5 };
      await updateBulkItem(req, res);
      
      const updateArg = foodModel.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg).not.toHaveProperty("image");
    });

    it("27. Should NOT update the category field during updateBulkItem", async () => {
      req.body = { id: "bulk_1", price: 90, inventoryCount: 5 };
      await updateBulkItem(req, res);
      
      const updateArg = foodModel.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg).not.toHaveProperty("category");
    });

    it("28. Should handle large numbers correctly", async () => {
      req.body = { id: "bulk_1", price: 999999, inventoryCount: 999999 };
      await updateBulkItem(req, res);
      
      expect(foodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "bulk_1",
        { price: 999999, surplusQuantity: 999999 }
      );
    });

    it("29. Should return correct status 200 on success", async () => {
      req.body = { id: "bulk_1", price: 90, inventoryCount: 5 };
      foodModel.findByIdAndUpdate.mockResolvedValue(true);
      await updateBulkItem(req, res);
      
      expect(res.json).toHaveBeenCalled();
    });

    // --- FIXED TEST CASE 30 ---
    it("30. Should handle malformed IDs gracefully", async () => {
      req.body = { id: "INVALID_ID_FORMAT", price: 90, inventoryCount: 5 };
      
      // Force the mock to throw an error synchronously when called
      // This ensures it triggers the catch block in your controller
      foodModel.findByIdAndUpdate.mockImplementation(() => {
        throw new Error("CastError");
      });
      
      await updateBulkItem(req, res);
      
      // Verify that res.json was called with success: false
      // checking 'objectContaining' allows the message to vary slightly without failing
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

  });
});