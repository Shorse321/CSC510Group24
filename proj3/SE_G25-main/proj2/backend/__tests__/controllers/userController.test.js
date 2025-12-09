import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";
import userModel from "../../models/userModel.js";
import { loginUser, registerUser } from "../../controllers/userController.js";

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

      // Mock the save method
      const mockSave = jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        email: "test@example.com",
      });

      // Mock userModel constructor
      const OriginalUserModel = userModel;
      global.userModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      // ✅ ACTUALLY CALL THE FUNCTION
      await registerUser(req, res);

      // Verify the function was executed
      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(validator.isEmail).toHaveBeenCalledWith("test@example.com");
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
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

    // NEW TEST CASES
    it("should hash password before saving", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      validator.isEmail = jest.fn().mockReturnValue(true);
      userModel.findOne = jest.fn().mockResolvedValue(null);
      bcrypt.genSalt = jest.fn().mockResolvedValue("salt");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

      const mockSave = jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
      });

      global.userModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      await registerUser(req, res);

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt");
    });

    it("should return error for missing name", async () => {
      req.body = {
        name: "",
        email: "test@example.com",
        password: "password123",
      };

      validator.isEmail = jest.fn().mockReturnValue(true);
      userModel.findOne = jest.fn().mockResolvedValue(null);

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });

    it("should validate email format before checking existence", async () => {
      req.body = {
        name: "Test User",
        email: "notanemail",
        password: "password123",
      };

      validator.isEmail = jest.fn().mockReturnValue(false);

      await registerUser(req, res);

      expect(validator.isEmail).toHaveBeenCalledWith("notanemail");
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please enter a valid email",
      });
    });

    it("should check password length (minimum 8 characters)", async () => {
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

    // NEW TEST CASES
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

    it("should handle missing password in request", async () => {
      req.body = {
        email: "test@example.com",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword",
      };

      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials",
      });
    });

    it("should query database with exact email match", async () => {
      req.body = {
        email: "user@example.com",
        password: "password123",
      };

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "user@example.com",
      });
    });

    it("should handle case-sensitive email lookup", async () => {
      req.body = {
        email: "Test@Example.com",
        password: "password123",
      };

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "Test@Example.com",
      });
    });
  });
});
