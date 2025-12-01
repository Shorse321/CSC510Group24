import express from "express";
import { loginUser, registerUser, getPreferences, updatePreferences } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/preferences", authMiddleware, getPreferences);
userRouter.put("/preferences", authMiddleware, updatePreferences);

export default userRouter;