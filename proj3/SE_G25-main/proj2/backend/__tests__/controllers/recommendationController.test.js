import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const serviceModulePath = new URL(
  "../../services/ruleBasedRecommendationService.js",
  import.meta.url
).pathname;

const controllerModulePath = new URL(
  "../../controllers/recommendationController.js",
  import.meta.url
).pathname;

const mockRecommendationService = jest.fn();

jest.unstable_mockModule(
  serviceModulePath,
  () => ({
    getRuleBasedMealRecommendations: mockRecommendationService,
  })
);

const { getMealRecommendations } = await import(controllerModulePath);

describe("recommendationController", () => {
  let req;
  let res;
  let consoleErrorSpy;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
    };
    res = {
      json: jest.fn(),
    };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
    mockRecommendationService.mockReset();
  });

  it("returns error when user context is missing", async () => {
    await getMealRecommendations(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User context missing from request",
    });
    expect(mockRecommendationService).not.toHaveBeenCalled();
  });

  it("returns recommendations and hides profile by default", async () => {
    req.body.userId = "user-1";
    mockRecommendationService.mockResolvedValue({
      recommendations: [{ foodId: "food-1" }],
      profile: { userId: "user-1" },
    });

    await getMealRecommendations(req, res);

    expect(mockRecommendationService).toHaveBeenCalledWith("user-1", {
      limit: undefined,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        recommendations: [{ foodId: "food-1" }],
      },
    });
  });

  it("includes profile when debug query parameter is true", async () => {
    req.body.userId = "user-1";
    req.query.debug = "true";
    mockRecommendationService.mockResolvedValue({
      recommendations: [],
      profile: { userId: "user-1" },
    });

    await getMealRecommendations(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        recommendations: [],
        profile: { userId: "user-1" },
      },
    });
  });

  it("handles service errors gracefully", async () => {
    req.body.userId = "user-1";
    const error = new Error("service failure");
    mockRecommendationService.mockRejectedValue(error);

    await getMealRecommendations(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "service failure",
    });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });
});
