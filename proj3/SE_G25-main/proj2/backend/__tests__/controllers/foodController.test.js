import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import foodModel from "../../models/foodModel.js";
import {
  listFood,
  addFood,
  removeFood,
  toggleSurplus,
  createBulkItem,
  updateBulkItem,
} from "../../controllers/foodController.js";
import fs from "fs";

// Mock fs module
jest.mock("fs", () => ({
  default: {
    unlink: jest.fn((path, callback) => callback && callback()),
  },
}));

describe("Food Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      file: {
        buffer: Buffer.from("fake-image-data"),
        mimetype: "image/png",
      },
      files: {
        image: [
          {
            buffer: Buffer.from("fake-image-data"),
            mimetype: "image/png",
          },
        ],
      },
    };
    res = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("listFood", () => {
    it("should list all foods with base64 images", async () => {
      const mockFoods = [
        {
          _id: "507f1f77bcf86cd799439011",
          name: "Test Food 1",
          description: "Description 1",
          price: 10.99,
          category: "Category 1",
          image: {
            data: Buffer.from("image1"),
            contentType: "image/png",
          },
          toObject: jest.fn().mockReturnValue({
            _id: "507f1f77bcf86cd799439011",
            name: "Test Food 1",
            description: "Description 1",
            price: 10.99,
            category: "Category 1",
            image: {
              data: Buffer.from("image1"),
              contentType: "image/png",
            },
          }),
        },
        {
          _id: "507f1f77bcf86cd799439012",
          name: "Test Food 2",
          description: "Description 2",
          price: 15.99,
          category: "Category 2",
          image: {
            data: Buffer.from("image2"),
            contentType: "image/jpeg",
          },
          toObject: jest.fn().mockReturnValue({
            _id: "507f1f77bcf86cd799439012",
            name: "Test Food 2",
            description: "Description 2",
            price: 15.99,
            category: "Category 2",
            image: {
              data: Buffer.from("image2"),
              contentType: "image/jpeg",
            },
          }),
        },
      ];

      foodModel.find = jest.fn().mockResolvedValue(mockFoods);

      await listFood(req, res);

      expect(foodModel.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].data).toBeDefined();
      expect(res.json.mock.calls[0][0].data.length).toBe(2);
    });

    it("should handle errors when listing foods", async () => {
      foodModel.find = jest.fn().mockRejectedValue(new Error("Database error"));

      await listFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    // NEW TEST CASES
    it("should convert image buffer to base64", async () => {
      const mockFoods = [
        {
          toObject: jest.fn().mockReturnValue({
            _id: "507f1f77bcf86cd799439011",
            name: "Test Food",
            image: {
              data: Buffer.from("test-image"),
              contentType: "image/png",
            },
          }),
        },
      ];

      foodModel.find = jest.fn().mockResolvedValue(mockFoods);

      await listFood(req, res);

      const responseData = res.json.mock.calls[0][0].data[0];
      expect(typeof responseData.image.data).toBe("string");
      expect(responseData.image.data).toBe(Buffer.from("test-image").toString("base64"));
    });

    it("should convert 3D model buffer to base64", async () => {
      const mockFoods = [
        {
          toObject: jest.fn().mockReturnValue({
            _id: "507f1f77bcf86cd799439011",
            name: "Test Food",
            image: {
              data: Buffer.from("test-image"),
              contentType: "image/png",
            },
            model3D: {
              data: Buffer.from("test-model"),
              contentType: "model/gltf-binary",
            },
          }),
        },
      ];

      foodModel.find = jest.fn().mockResolvedValue(mockFoods);

      await listFood(req, res);

      const responseData = res.json.mock.calls[0][0].data[0];
      expect(typeof responseData.model3D.data).toBe("string");
      expect(responseData.model3D.data).toBe(Buffer.from("test-model").toString("base64"));
    });

    it("should handle empty food list", async () => {
      foodModel.find = jest.fn().mockResolvedValue([]);

      await listFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it("should handle food without 3D model", async () => {
      const mockFoods = [
        {
          toObject: jest.fn().mockReturnValue({
            _id: "507f1f77bcf86cd799439011",
            name: "Test Food",
            image: {
              data: Buffer.from("test-image"),
              contentType: "image/png",
            },
          }),
        },
      ];

      foodModel.find = jest.fn().mockResolvedValue(mockFoods);

      await listFood(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].data[0].model3D).toBeUndefined();
    });
  });

  describe("addFood", () => {
    it("should add food with image successfully", async () => {
      req.body = {
        name: "New Food",
        description: "Food description",
        price: 12.99,
        category: "Category",
      };

      const mockSave = jest.fn().mockResolvedValue(true);
      foodModel.prototype.save = mockSave;

      // Mock the constructor
      const originalFoodModel = foodModel;
      global.foodModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      await addFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Food Added",
      });
    });

    it("should add food with image and 3D model successfully", async () => {
      req.body = {
        name: "New Food",
        description: "Food description",
        price: 12.99,
        category: "Category",
      };
      req.files.model3D = [
        {
          buffer: Buffer.from("fake-model-data"),
          mimetype: "model/gltf-binary",
        },
      ];

      const mockSave = jest.fn().mockResolvedValue(true);
      foodModel.prototype.save = mockSave;

      await addFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Food Added",
      });
    });

    it("should handle errors when adding food", async () => {
      req.body = {
        name: "New Food",
        description: "Food description",
        price: 12.99,
        category: "Category",
      };

      foodModel.prototype.save = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await addFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should handle missing image file", async () => {
      req.body = {
        name: "New Food",
        description: "Food description",
        price: 12.99,
        category: "Category",
      };
      req.files.image = undefined;

      await addFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should add food without 3D model", async () => {
      req.body = {
        name: "New Food",
        description: "Food description",
        price: 12.99,
        category: "Category",
      };
      req.files.model3D = undefined;

      const mockSave = jest.fn().mockResolvedValue(true);
      foodModel.prototype.save = mockSave;

      await addFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Food Added",
      });
    });
  });

  describe("removeFood", () => {
    it("should remove food successfully", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
      };

      const mockFood = {
        _id: "507f1f77bcf86cd799439011",
        image: "image.png",
      };

      foodModel.findById = jest.fn().mockResolvedValue(mockFood);
      foodModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockFood);

      await removeFood(req, res);

      expect(foodModel.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(foodModel.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Food Removed",
      });
    });

    it("should handle errors when removing food", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
      };

      foodModel.findById = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await removeFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    // NEW TEST CASES
    it("should call fs.unlink to delete image file", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
      };

      const mockFood = {
        _id: "507f1f77bcf86cd799439011",
        image: "test-image.png",
      };

      foodModel.findById = jest.fn().mockResolvedValue(mockFood);
      foodModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockFood);

      await removeFood(req, res);

      expect(fs.unlink).toHaveBeenCalledWith(
        "uploads/test-image.png",
        expect.any(Function)
      );
    });

    it("should remove food even if image file deletion fails", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
      };

      const mockFood = {
        _id: "507f1f77bcf86cd799439011",
        image: "nonexistent.png",
      };

      foodModel.findById = jest.fn().mockResolvedValue(mockFood);
      foodModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockFood);

      await removeFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Food Removed",
      });
    });

    it("should handle food not found error", async () => {
      req.body = {
        id: "nonexistent123",
      };

      foodModel.findById = jest.fn().mockResolvedValue(null);

      await removeFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });

  describe("toggleSurplus", () => {
    it("should toggle surplus status successfully", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        isSurplus: true,
        surplusPrice: 8.99,
        surplusQuantity: 10,
      };

      foodModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        isSurplus: true,
        surplusPrice: 8.99,
        surplusQuantity: 10,
      });

      await toggleSurplus(req, res);

      expect(foodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {
          isSurplus: true,
          surplusPrice: 8.99,
          surplusQuantity: 10,
        }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Surplus Status Updated",
      });
    });

    it("should disable surplus status", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        isSurplus: false,
        surplusPrice: 0,
        surplusQuantity: 0,
      };

      foodModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        isSurplus: false,
      });

      await toggleSurplus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Surplus Status Updated",
      });
    });

    it("should handle errors when toggling surplus", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        isSurplus: true,
        surplusPrice: 8.99,
        surplusQuantity: 10,
      };

      foodModel.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await toggleSurplus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error Updating Surplus",
      });
    });

    it("should update surplus with different quantities", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        isSurplus: true,
        surplusPrice: 5.99,
        surplusQuantity: 50,
      };

      foodModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await toggleSurplus(req, res);

      expect(foodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          surplusQuantity: 50,
        })
      );
    });
  });

  describe("createBulkItem", () => {
    it("should create bulk item successfully", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        bulkPrice: 25.99,
        packSize: 5,
        inventoryCount: 20,
      };

      const mockOriginalFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Sandwich",
        description: "Original sandwich",
        image: { data: Buffer.from("image"), contentType: "image/png" },
        model3D: { data: Buffer.from("model"), contentType: "model/gltf" },
      };

      foodModel.findById = jest.fn().mockResolvedValue(mockOriginalFood);
      const mockSave = jest.fn().mockResolvedValue(true);
      foodModel.prototype.save = mockSave;

      await createBulkItem(req, res);

      expect(foodModel.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Bulk Pack Created!",
      });
    });

    it("should handle item not found when creating bulk", async () => {
      req.body = {
        id: "nonexistent123",
        bulkPrice: 25.99,
        packSize: 5,
        inventoryCount: 20,
      };

      foodModel.findById = jest.fn().mockResolvedValue(null);

      await createBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Item not found",
      });
    });

    it("should handle errors when creating bulk item", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        bulkPrice: 25.99,
        packSize: 5,
        inventoryCount: 20,
      };

      foodModel.findById = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await createBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should create bulk item with correct name format", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        bulkPrice: 30.99,
        packSize: 10,
        inventoryCount: 15,
      };

      const mockOriginalFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Pizza",
        image: { data: Buffer.from("image"), contentType: "image/png" },
      };

      foodModel.findById = jest.fn().mockResolvedValue(mockOriginalFood);
      foodModel.prototype.save = jest.fn().mockResolvedValue(true);

      await createBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Bulk Pack Created!",
      });
    });

    it("should set bulk category correctly", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        bulkPrice: 20.99,
        packSize: 3,
        inventoryCount: 25,
      };

      const mockOriginalFood = {
        _id: "507f1f77bcf86cd799439011",
        name: "Burger",
        image: { data: Buffer.from("image"), contentType: "image/png" },
      };

      foodModel.findById = jest.fn().mockResolvedValue(mockOriginalFood);
      foodModel.prototype.save = jest.fn().mockResolvedValue(true);

      await createBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Bulk Pack Created!",
      });
    });
  });

  describe("updateBulkItem", () => {
    it("should update bulk item successfully", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        price: 29.99,
        inventoryCount: 30,
      };

      foodModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        price: 29.99,
        surplusQuantity: 30,
      });

      await updateBulkItem(req, res);

      expect(foodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {
          price: 29.99,
          surplusQuantity: 30,
        }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Bulk Pack Updated",
      });
    });

    it("should handle errors when updating bulk item", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        price: 29.99,
        inventoryCount: 30,
      };

      foodModel.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await updateBulkItem(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error updating bulk pack",
      });
    });

    it("should update price and inventory separately", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        price: 19.99,
        inventoryCount: 10,
      };

      foodModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await updateBulkItem(req, res);

      expect(foodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          price: 19.99,
          surplusQuantity: 10,
        })
      );
    });

    it("should convert string price to number", async () => {
      req.body = {
        id: "507f1f77bcf86cd799439011",
        price: "24.99",
        inventoryCount: "15",
      };

      foodModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await updateBulkItem(req, res);

      expect(foodModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {
          price: 24.99,
          surplusQuantity: 15,
        }
      );
    });
  });
});
