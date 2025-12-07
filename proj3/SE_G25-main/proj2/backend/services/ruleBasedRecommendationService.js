import foodModel from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const ORDER_HISTORY_LOOKBACK = 75;

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeQuantity = (value) => {
  const qty = Number(value);
  if (!Number.isFinite(qty) || qty <= 0) return 1;
  return qty;
};

const extractItemId = (item = {}) => {
  const value =
    item?._id ||
    item?.id ||
    item?.itemId ||
    item?.foodId ||
    item?.productId ||
    "";
  return value ? value.toString() : "";
};

const determineEffectivePrice = (food) => {
  const surplusPrice = safeNumber(food?.surplusPrice, 0);
  if (food?.isSurplus && surplusPrice > 0) {
    return surplusPrice;
  }
  return safeNumber(food?.price, 0);
};

const determinePriceRange = (preferences = {}, avgItemPrice = null) => {
  const minPref = preferences.minPrice ?? null;
  const maxPref = preferences.maxPrice ?? null;

  const parsedMin = Number.isFinite(Number(minPref))
    ? Number(minPref)
    : null;
  const parsedMax = Number.isFinite(Number(maxPref))
    ? Number(maxPref)
    : null;

  if (parsedMin !== null || parsedMax !== null) {
    return {
      min: parsedMin ?? 0,
      max: parsedMax ?? null,
      source: "user",
      strict: true,
    };
  }

  if (avgItemPrice !== null && Number.isFinite(avgItemPrice)) {
    const tolerance = Math.max(5, avgItemPrice * 0.4);
    return {
      min: Math.max(avgItemPrice - tolerance, 0),
      max: avgItemPrice + tolerance,
      source: "history",
      strict: false,
    };
  }

  return null;
};

const doesPriceFitRange = (price, range) => {
  if (!range) return true;
  const min = Number.isFinite(range.min) ? range.min : 0;
  const max = Number.isFinite(range.max) ? range.max : Infinity;
  return price >= min && price <= max;
};

const buildPreferenceTagList = (userPreferredItems, profile) => {
  const tags = new Set();
  (userPreferredItems || [])
    .map((tag) => tag && tag.toString().trim().toLowerCase())
    .filter(Boolean)
    .forEach((tag) => tags.add(tag));

  (profile.topCategories || [])
    .map((c) => c.name && c.name.toString().toLowerCase())
    .filter(Boolean)
    .forEach((tag) => tags.add(tag));

  (profile.behavioralTags || [])
    .map((tag) => tag && tag.toString().toLowerCase())
    .filter(Boolean)
    .forEach((tag) => tags.add(tag));

  return Array.from(tags);
};

const deriveBehavioralTags = (stats) => {
  const tags = [];
  if (stats.avgItemPrice !== null) {
    if (stats.avgItemPrice < 15) tags.push("value-seeker");
    else if (stats.avgItemPrice > 30) tags.push("premium-lover");
  }
  if (stats.totalOrders >= 5) tags.push("loyal-customer");
  if (stats.totalOrders === 0) tags.push("new-user");
  return tags;
};

const buildHistoricalStats = (orders, foodsById) => {
  const stats = {
    totalOrders: orders.length,
    totalItems: 0,
    totalSpend: 0,
    categoryCounts: {},
    itemCounts: {},
    lastOrderDate: null,
  };

  orders.forEach((order, index) => {
    const date = order?.date ? new Date(order.date) : null;
    if (index === 0 && date) {
      stats.lastOrderDate = date.toISOString();
    }

    const orderItems = Array.isArray(order?.items) ? order.items : [];
    orderItems.forEach((item) => {
      const itemId = extractItemId(item);
      const quantity = normalizeQuantity(item?.quantity ?? item?.qty ?? 1);
      const fallbackFood = itemId ? foodsById.get(itemId) : null;
      const category = item?.category || fallbackFood?.category || null;
      const unitPrice = safeNumber(
        item?.price ?? fallbackFood?.price ?? 0,
        0
      );

      stats.totalItems += quantity;
      stats.totalSpend += unitPrice * quantity;

      if (itemId) {
        stats.itemCounts[itemId] =
          (stats.itemCounts[itemId] || 0) + quantity;
      }

      if (category) {
        stats.categoryCounts[category] =
          (stats.categoryCounts[category] || 0) + quantity;
      }
    });
  });

  stats.avgItemPrice =
    stats.totalItems > 0 ? stats.totalSpend / stats.totalItems : null;

  stats.topItems = Object.entries(stats.itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([itemId, quantity]) => ({
      itemId,
      quantity,
    }));

  stats.topCategories = Object.entries(stats.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, quantity]) => ({
      name,
      quantity,
    }));

  return stats;
};

const buildUserProfile = (user, orders, foodsById) => {
  const stats = buildHistoricalStats(orders, foodsById);
  const preferences = user?.preferences || {};
  const profile = {
    userId: user?._id?.toString(),
    totalOrders: stats.totalOrders,
    totalItems: stats.totalItems,
    avgItemPrice: stats.avgItemPrice,
    itemCounts: stats.itemCounts,
    categoryCounts: stats.categoryCounts,
    favoriteItems: stats.topItems.map((entry) => {
      const food = foodsById.get(entry.itemId);
      return {
        itemId: entry.itemId,
        quantity: entry.quantity,
        name: food?.name || null,
        category: food?.category || null,
      };
    }),
    topCategories: stats.topCategories.map((entry) => ({
      name: entry.name,
      quantity: entry.quantity,
      weight:
        stats.totalItems > 0 ? entry.quantity / stats.totalItems : 0,
    })),
    lastOrderDate: stats.lastOrderDate,
    hasHistory: stats.totalOrders > 0,
    priceRange: determinePriceRange(preferences, stats.avgItemPrice),
    rawPreferredItems: Array.isArray(preferences.preferredItems)
      ? preferences.preferredItems
      : [],
  };

  profile.behavioralTags = deriveBehavioralTags(stats);
  profile.preferenceTags = buildPreferenceTagList(
    profile.rawPreferredItems,
    profile
  );
  profile.generatedAt = new Date().toISOString();
  profile.historySampleSize = orders.length;

  return profile;
};

const evaluateFoodAgainstRules = (food, profile) => {
  const reasons = [];
  const rules = [];
  const normalizedCategory = (food?.category || "").toLowerCase();
  const normalizedName = (food?.name || "").toLowerCase();
  const normalizedDescription = (food?.description || "").toLowerCase();
  const effectivePrice = determineEffectivePrice(food);
  let score = 0;

  const priceFits = doesPriceFitRange(effectivePrice, profile.priceRange);
  if (priceFits) {
    score += profile.priceRange ? 18 : 10;
    if (profile.priceRange) {
      reasons.push("Within preferred price range");
    }
    rules.push("price_alignment");
  } else if (profile.priceRange?.strict) {
    return { score: -Infinity, reasons, rules, priceFits };
  } else if (profile.priceRange) {
    score -= 8;
  }

  const itemId = food?._id?.toString();
  const itemFrequency = itemId ? profile.itemCounts[itemId] : 0;
  if (itemFrequency) {
    score += Math.min(35, 20 + itemFrequency * 2);
    reasons.push("Frequently re-ordered item");
    rules.push("historical_frequency");
  }

  const categoryIndex = profile.topCategories.findIndex(
    (entry) =>
      entry.name &&
      entry.name.toLowerCase() === normalizedCategory
  );
  if (categoryIndex !== -1) {
    const weight = profile.topCategories[categoryIndex].weight || 0;
    const boost = 20 + Math.round(weight * 20) - categoryIndex * 3;
    score += boost;
    reasons.push(`Popular category: ${food.category}`);
    rules.push("category_affinity");
  }

  const matchedTags = profile.preferenceTags.filter((tag) => {
    if (!tag) return false;
    return (
      normalizedName.includes(tag) ||
      normalizedDescription.includes(tag) ||
      normalizedCategory === tag
    );
  });
  if (matchedTags.length) {
    score += matchedTags.length * 10;
    reasons.push(`Matches preference tags (${matchedTags.join(", ")})`);
    rules.push("tag_match");
  }

  if (!itemFrequency && categoryIndex !== -1 && profile.hasHistory) {
    score += 6;
    reasons.push("New option within a favorite category");
    rules.push("novelty_within_category");
  }

  if (
    food?.isSurplus &&
    (profile.preferenceTags.includes("surplus") ||
      profile.behavioralTags.includes("value-seeker"))
  ) {
    score += 7;
    reasons.push("Discounted surplus item fits value-seeking behavior");
    rules.push("value_alignment");
  }

  if (!profile.hasHistory) {
    score += 12;
    reasons.push("Cold start recommendation");
    rules.push("cold_start");
  }

  const roundedScore = Math.round(score * 100) / 100;
  return { score: roundedScore, reasons, rules, priceFits };
};

const normalizeLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.round(parsed), MAX_LIMIT);
};

export const getRuleBasedMealRecommendations = async (
  userId,
  options = {}
) => {
  if (!userId) {
    throw new Error("User id is required to generate recommendations");
  }

  const limit = normalizeLimit(options.limit ?? DEFAULT_LIMIT);

  const [user, orders, foods] = await Promise.all([
    userModel.findById(userId).lean(),
    orderModel
      .find({ userId })
      .sort({ date: -1 })
      .limit(ORDER_HISTORY_LOOKBACK)
      .lean(),
    foodModel.find({}).lean(),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  if (!foods.length) {
    return {
      recommendations: [],
      profile: null,
    };
  }

  const foodsById = new Map(
    foods.map((food) => [food?._id?.toString(), food])
  );

  const profile = buildUserProfile(user, orders, foodsById);

  const scored = foods.map((food) => {
    const evaluation = evaluateFoodAgainstRules(food, profile);
    return {
      food,
      foodId: food?._id?.toString(),
      ...evaluation,
    };
  });

  const filtered = scored.filter((entry) => {
    if (!entry.foodId) return false;
    if (profile.priceRange?.strict && !entry.priceFits) return false;
    if (profile.hasHistory) return entry.score > 0;
    return true;
  });

  let ranked = filtered
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!ranked.length) {
    const fallbackPool = foods
      .map((food) => ({
        food,
        foodId: food?._id?.toString(),
        priceFits: doesPriceFitRange(
          determineEffectivePrice(food),
          profile.priceRange
        ),
      }))
      .filter(
        (entry) =>
          entry.foodId &&
          (entry.priceFits || !profile.priceRange?.strict)
      )
      .slice(0, limit);

    ranked = fallbackPool.map((entry) => ({
      ...entry,
      score: 0,
      reasons: [
        profile.hasHistory
          ? "Fallback recommendation (insufficient signal)"
          : "Fallback recommendation for new users",
      ],
      rules: ["fallback"],
    }));
  }

  const rulesUsed = new Set();
  ranked.forEach((entry) => {
    (entry.rules || []).forEach((rule) => rulesUsed.add(rule));
  });
  profile.rulesEvaluated = Array.from(rulesUsed);

  const recommendations = ranked.map((entry) => ({
    foodId: entry.foodId,
    name: entry.food?.name,
    description: entry.food?.description,
    category: entry.food?.category,
    price: safeNumber(entry.food?.price, 0),
    surplusPrice: entry.food?.isSurplus
      ? safeNumber(entry.food?.surplusPrice, null)
      : null,
    isSurplus: Boolean(entry.food?.isSurplus),
    score: entry.score,
    reasons: entry.reasons,
    appliedRules: entry.rules,
  }));

  return {
    recommendations,
    profile,
  };
};
