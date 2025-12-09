import express from "express";
import { getMealRecommendations } from "../controllers/recommendationController.js";
import authMiddleware from "../middleware/auth.js";

const recommendationRouter = express.Router();

recommendationRouter.get("/meals", authMiddleware, getMealRecommendations);

export default recommendationRouter;
