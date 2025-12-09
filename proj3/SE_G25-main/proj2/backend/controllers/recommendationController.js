import { getRuleBasedMealRecommendations } from "../services/ruleBasedRecommendationService.js";

/**
 * Generates personalized meal recommendations for the authenticated user.
 * Applies a rule-based engine that considers historical orders, preference tags,
 * and item-level attributes (price, surplus status, category, etc.).
 */
const getMealRecommendations = async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.json({
        success: false,
        message: "User context missing from request",
      });
    }

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const includeProfile =
      req.query.debug === "true" || req.query.profile === "true";

    const result = await getRuleBasedMealRecommendations(userId, {
      limit,
    });

    const payload = {
      success: true,
      data: {
        recommendations: result.recommendations,
      },
    };

    if (includeProfile) {
      payload.data.profile = result.profile;
    }

    return res.json(payload);
  } catch (error) {
    console.error("getMealRecommendations error:", error);
    return res.json({
      success: false,
      message:
        error?.message || "Unable to generate recommendations right now",
    });
  }
};

export { getMealRecommendations };
