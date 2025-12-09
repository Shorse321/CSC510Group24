import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import userModel from "../../models/userModel.js";
import {
  addToCart,
  removeFromCart,
  getCart,
} from "../../controllers/cartController.js";

describe("Cart Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("addToCart", () => {
    it("should add new item to cart", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {},
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await addToCart(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        _id: "507f1f77bcf86cd799439011",
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Added To Cart",
      });
    });

    it("should increment quantity for existing item", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 2,
        },
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await addToCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Added To Cart",
      });
    });

    it("should handle errors when adding to cart", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      userModel.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await addToCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    // NEW TEST CASES
    it("should add multiple different items to cart", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439013": 1,
        },
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await addToCart(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          cartData: expect.objectContaining({
            "507f1f77bcf86cd799439012": 1,
            "507f1f77bcf86cd799439013": 1,
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Added To Cart",
      });
    });

    it("should handle adding same item multiple times", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 5,
        },
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await addToCart(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          cartData: expect.objectContaining({
            "507f1f77bcf86cd799439012": 6,
          }),
        })
      );
    });

    it("should handle database update error", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {},
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      await addToCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should correctly set quantity to 1 for new item", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {},
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await addToCart(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          cartData: expect.objectContaining({
            "507f1f77bcf86cd799439012": 1,
          }),
        })
      );
    });
  });

  describe("removeFromCart", () => {
    it("should remove item from cart", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 2,
        },
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await removeFromCart(req, res);

      expect(userModel.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Removed From Cart",
      });
    });

    it("should not decrement below zero", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 0,
        },
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await removeFromCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Removed From Cart",
      });
    });

    it("should handle errors when removing from cart", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      userModel.findById = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await removeFromCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    // NEW TEST CASES
    it("should handle removing item that does not exist in cart", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439099",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 2,
        },
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await removeFromCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Removed From Cart",
      });
    });

    it("should decrement quantity correctly from 3 to 2", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 3,
        },
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await removeFromCart(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          cartData: expect.objectContaining({
            "507f1f77bcf86cd799439012": 2,
          }),
        })
      );
    });

    it("should handle cart with multiple items when removing one", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 3,
          "507f1f77bcf86cd799439013": 2,
          "507f1f77bcf86cd799439014": 1,
        },
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await removeFromCart(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          cartData: expect.objectContaining({
            "507f1f77bcf86cd799439012": 2,
            "507f1f77bcf86cd799439013": 2,
            "507f1f77bcf86cd799439014": 1,
          }),
        })
      );
    });

    it("should handle database update error when removing", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 2,
        },
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      await removeFromCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should reduce item to zero when quantity is 1", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        itemId: "507f1f77bcf86cd799439012",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {
          "507f1f77bcf86cd799439012": 1,
        },
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);

      await removeFromCart(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          cartData: expect.objectContaining({
            "507f1f77bcf86cd799439012": 0,
          }),
        })
      );
    });
  });

  describe("getCart", () => {
    it("should get user cart successfully", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      const mockCartData = {
        "507f1f77bcf86cd799439012": 2,
        "507f1f77bcf86cd799439013": 1,
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: mockCartData,
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);

      await getCart(req, res);

      expect(userModel.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        cartData: mockCartData,
      });
    });

    it("should handle errors when getting cart", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      userModel.findById = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    // NEW TEST CASES
    it("should retrieve empty cart for new user", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {},
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);

      await getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        cartData: {},
      });
    });

    it("should retrieve cart with single item", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      const mockCartData = {
        "507f1f77bcf86cd799439012": 5,
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: mockCartData,
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);

      await getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        cartData: mockCartData,
      });
    });

    it("should retrieve cart with multiple items", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      const mockCartData = {
        "507f1f77bcf86cd799439012": 1,
        "507f1f77bcf86cd799439013": 2,
        "507f1f77bcf86cd799439014": 3,
        "507f1f77bcf86cd799439015": 4,
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: mockCartData,
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);

      await getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        cartData: mockCartData,
      });
    });

    it("should handle cart with zero quantities", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      const mockCartData = {
        "507f1f77bcf86cd799439012": 0,
        "507f1f77bcf86cd799439013": 2,
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: mockCartData,
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);

      await getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        cartData: mockCartData,
      });
    });

    it("should handle user not found error", async () => {
      req.body = {
        userId: "nonexistent123",
      };

      userModel.findById = jest
        .fn()
        .mockRejectedValue(new Error("User not found"));

      await getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should call findById with correct userId", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        cartData: {},
      };

      userModel.findById = jest.fn().mockResolvedValue(mockUser);

      await getCart(req, res);

      expect(userModel.findById).toHaveBeenCalledTimes(1);
      expect(userModel.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
    });
  });

  describe("Integration-like scenarios", () => {
    it("should handle add and get cart sequence", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const itemId = "507f1f77bcf86cd799439012";

      // Add to cart
      req.body = { userId, itemId };
      const mockUser1 = {
        _id: userId,
        cartData: {},
      };
      userModel.findOne = jest.fn().mockResolvedValue(mockUser1);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser1);

      await addToCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Added To Cart",
      });

      // Get cart
      req.body = { userId };
      const mockUser2 = {
        _id: userId,
        cartData: { [itemId]: 1 },
      };
      userModel.findById = jest.fn().mockResolvedValue(mockUser2);

      await getCart(req, res);

      expect(res.json).toHaveBeenLastCalledWith({
        success: true,
        cartData: { [itemId]: 1 },
      });
    });

    it("should handle multiple additions of same item", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const itemId = "507f1f77bcf86cd799439012";

      req.body = { userId, itemId };

      // First add
      let mockUser = { _id: userId, cartData: {} };
      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
      await addToCart(req, res);

      // Second add
      mockUser = { _id: userId, cartData: { [itemId]: 1 } };
      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      await addToCart(req, res);

      // Third add
      mockUser = { _id: userId, cartData: { [itemId]: 2 } };
      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      await addToCart(req, res);

      expect(res.json).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenLastCalledWith({
        success: true,
        message: "Added To Cart",
      });
    });

    it("should handle add, remove sequence", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const itemId = "507f1f77bcf86cd799439012";

      // Add item
      req.body = { userId, itemId };
      const mockUser1 = {
        _id: userId,
        cartData: {},
      };
      userModel.findOne = jest.fn().mockResolvedValue(mockUser1);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser1);
      await addToCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Added To Cart",
      });

      // Remove item
      const mockUser2 = {
        _id: userId,
        cartData: { [itemId]: 1 },
      };
      userModel.findById = jest.fn().mockResolvedValue(mockUser2);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser2);
      await removeFromCart(req, res);

      expect(res.json).toHaveBeenLastCalledWith({
        success: true,
        message: "Removed From Cart",
      });
    });
  });
});
