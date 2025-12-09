import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";
import userModel from "../../models/userModel.js";
import { loginUser, registerUser, getPreferences, updatePreferences } from "../../controllers/userController.js";

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      json: jest.fn(),
    };
    process.env.JWT_SECRET = "test-secret-key";
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      // Mock dependencies
      validator.isEmail = jest.fn().mockReturnValue(true);
      bcrypt.genSalt = jest.fn().mockResolvedValue("salt");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");
      userModel.findOne = jest.fn().mockResolvedValue(null);

      // Mock the save method on the prototype
      const mockSave = jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        email: "test@example.com",
      });
      
      userModel.prototype.save = mockSave;

      await registerUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(validator.isEmail).toHaveBeenCalledWith("test@example.com");
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt");
      expect(mockSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].token).toBeDefined();
    });

    it("should return error if user already exists", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      userModel.findOne = jest
        .fn()
        .mockResolvedValue({ email: "test@example.com" });

      await registerUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User already exists",
      });
    });

    it("should return error for invalid email", async () => {
      req.body = {
        name: "Test User",
        email: "invalid-email",
        password: "password123",
      };

      validator.isEmail = jest.fn().mockReturnValue(false);
      userModel.findOne = jest.fn().mockResolvedValue(null);

      await registerUser(req, res);

      expect(validator.isEmail).toHaveBeenCalledWith("invalid-email");
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please enter a valid email",
      });
    });

    it("should return error for weak password", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "short",
      };

      validator.isEmail = jest.fn().mockReturnValue(true);
      userModel.findOne = jest.fn().mockResolvedValue(null);

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please enter a strong password",
      });
    });

    it("should handle errors during registration", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      validator.isEmail = jest.fn().mockReturnValue(true);
      userModel.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should hash password before saving", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "mySecretPassword",
      };

      validator.isEmail = jest.fn().mockReturnValue(true);
      userModel.findOne = jest.fn().mockResolvedValue(null);
      bcrypt.genSalt = jest.fn().mockResolvedValue("generatedSalt");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

      const mockSave = jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
      });
      userModel.prototype.save = mockSave;

      await registerUser(req, res);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith("mySecretPassword", "generatedSalt");
    });

    it("should register user with address information", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        address: {
          formatted: "123 Main St, City, State",
          lat: 35.7796,
          lng: -78.6382,
        },
      };

      validator.isEmail = jest.fn().mockReturnValue(true);
      userModel.findOne = jest.fn().mockResolvedValue(null);
      bcrypt.genSalt = jest.fn().mockResolvedValue("salt");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

      const mockSave = jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
      });
      userModel.prototype.save = mockSave;

      await registerUser(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].token).toBeDefined();
    });

    it("should validate email format before checking existence", async () => {
      req.body = {
        name: "Test User",
        email: "notanemail",
        password: "password123",
      };

      validator.isEmail = jest.fn().mockReturnValue(false);
      userModel.findOne = jest.fn().mockResolvedValue(null);

      await registerUser(req, res);

      expect(validator.isEmail).toHaveBeenCalledWith("notanemail");
      expect(userModel.findOne).toHaveBeenCalledWith({ email: "notanemail" });
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please enter a valid email",
      });
    });

    it("should check password length is at least 8 characters", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "1234567", // 7 characters
      };

      validator.isEmail = jest.fn().mockReturnValue(true);
      userModel.findOne = jest.fn().mockResolvedValue(null);

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please enter a strong password",
      });
    });

    it("should handle save errors", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      validator.isEmail = jest.fn().mockReturnValue(true);
      userModel.findOne = jest.fn().mockResolvedValue(null);
      bcrypt.genSalt = jest.fn().mockResolvedValue("salt");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

      userModel.prototype.save = jest
        .fn()
        .mockRejectedValue(new Error("Save failed"));

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });

  describe("loginUser", () => {
    it("should login user successfully with correct credentials", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword",
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await loginUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword"
      );
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].token).toBeDefined();
    });

    it("should return error if user does not exist", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User does not exist",
      });
    });

    it("should return error for invalid password", async () => {
      req.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword",
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await loginUser(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", "hashedPassword");
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials",
      });
    });

    it("should handle errors during login", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      userModel.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should generate JWT token on successful login", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword",
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await loginUser(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.token).toBeDefined();
      expect(typeof response.token).toBe("string");
    });

    it("should compare provided password with stored hash", async () => {
      req.body = {
        email: "test@example.com",
        password: "mypassword",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "storedHashedPassword",
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await loginUser(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "mypassword",
        "storedHashedPassword"
      );
    });

    it("should handle missing email in request", async () => {
      req.body = {
        password: "password123",
      };

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User does not exist",
      });
    });

    it("should handle bcrypt compare errors", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword",
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockRejectedValue(new Error("Compare error"));

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });

  describe("getPreferences", () => {
    it("should get user preferences successfully", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        preferences: {
          maxDistance: 10,
          minPrice: 5,
          maxPrice: 50,
          preferredItems: ["Pizza", "Burger"],
          notificationsEnabled: true,
        },
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      userModel.findById = jest.fn().mockReturnValue({ select: mockSelect });

      await getPreferences(req, res);

      expect(userModel.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(mockSelect).toHaveBeenCalledWith("preferences");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser.preferences,
      });
    });

    it("should return error if user not found", async () => {
      req.body = {
        userId: "nonexistent123",
      };

      const mockSelect = jest.fn().mockResolvedValue(null);
      userModel.findById = jest.fn().mockReturnValue({ select: mockSelect });

      await getPreferences(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
      });
    });

    it("should handle errors when fetching preferences", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
      };

      userModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      await getPreferences(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching preferences",
      });
    });
  });

  describe("updatePreferences", () => {
    it("should update user preferences successfully", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        maxDistance: 15,
        minPrice: 10,
        maxPrice: 100,
        preferredItems: ["Salad", "Soup"],
        notificationsEnabled: false,
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        preferences: {
          maxDistance: 15,
          minPrice: 10,
          maxPrice: 100,
          preferredItems: ["Salad", "Soup"],
          notificationsEnabled: false,
        },
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({ select: mockSelect });

      await updatePreferences(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {
          $set: {
            "preferences.maxDistance": 15,
            "preferences.minPrice": 10,
            "preferences.maxPrice": 100,
            "preferences.preferredItems": ["Salad", "Soup"],
            "preferences.notificationsEnabled": false,
          },
        },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Preferences updated successfully",
        data: mockUser.preferences,
      });
    });

    it("should update partial preferences", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        maxDistance: 20,
      };

      const mockUser = {
        preferences: { maxDistance: 20 },
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({ select: mockSelect });

      await updatePreferences(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {
          $set: {
            "preferences.maxDistance": 20,
          },
        },
        { new: true }
      );
    });

    it("should return error if user not found", async () => {
      req.body = {
        userId: "nonexistent123",
        maxDistance: 15,
      };

      const mockSelect = jest.fn().mockResolvedValue(null);
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({ select: mockSelect });

      await updatePreferences(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
      });
    });

    it("should handle errors when updating preferences", async () => {
      req.body = {
        userId: "507f1f77bcf86cd799439011",
        maxDistance: 15,
      };

      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      await updatePreferences(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error updating preferences",
      });
    });
  });
});
