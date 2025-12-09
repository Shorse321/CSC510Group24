import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { getRuleBasedMealRecommendations } from "../../services/ruleBasedRecommendationService.js";
import userModel from "../../models/userModel.js";
import orderModel from "../../models/orderModel.js";
import foodModel from "../../models/foodModel.js";

const createLeanResult = (value) => ({
  lean: jest.fn().mockResolvedValue(value),
});

const createOrderQuery = (orders) => {
  const query = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(orders),
  };
  return query;
};

describe("ruleBasedRecommendationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userModel.findById = jest.fn();
    orderModel.find = jest.fn();
    foodModel.find = jest.fn();
  });

  it("throws when user is not found", async () => {
    userModel.findById.mockReturnValue(createLeanResult(null));
    orderModel.find.mockReturnValue(createOrderQuery([]));
    foodModel.find.mockReturnValue(createLeanResult([]));

    await expect(
      getRuleBasedMealRecommendations("missing-user")
    ).rejects.toThrow("User not found");
  });

  it("returns empty recommendations when no foods exist", async () => {
    const user = { _id: "user-1", preferences: {} };
    userModel.findById.mockReturnValue(createLeanResult(user));
    orderModel.find.mockReturnValue(createOrderQuery([]));
    foodModel.find.mockReturnValue(createLeanResult([]));

    const result = await getRuleBasedMealRecommendations("user-1");

    expect(result.recommendations).toEqual([]);
    expect(result.profile).toBeNull();
  });

  it("prioritizes frequently ordered items and filters by price range", async () => {
    const user = {
      _id: "user-1",
      preferences: { minPrice: 5, maxPrice: 20, preferredItems: ["salad"] },
    };
    const orders = [
      {
        date: new Date().toISOString(),
        items: [
          { _id: "food-1", quantity: 2, category: "Salad", price: 12 },
        ],
      },
    ];
    const foods = [
      {
        _id: "food-1",
        name: "Greek Salad",
        description: "Fresh salad",
        category: "Salad",
        price: 12,
        isSurplus: false,
      },
      {
        _id: "food-2",
        name: "Value Soup",
        description: "Cheap soup",
        category: "Soup",
        price: 3,
      },
    ];

    userModel.findById.mockReturnValue(createLeanResult(user));
    orderModel.find.mockReturnValue(createOrderQuery(orders));
    foodModel.find.mockReturnValue(createLeanResult(foods));

    const result = await getRuleBasedMealRecommendations("user-1", {
      limit: 5,
    });

    expect(result.profile).toMatchObject({
      userId: "user-1",
      hasHistory: true,
      rawPreferredItems: ["salad"],
    });
    expect(result.profile.rulesEvaluated.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBe(1);
    expect(result.recommendations[0]).toMatchObject({
      foodId: "food-1",
      name: "Greek Salad",
    });
    expect(result.recommendations[0].reasons.length).toBeGreaterThan(0);
  });
});
