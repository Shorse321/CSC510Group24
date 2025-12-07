import React, { useCallback, useContext, useEffect, useState } from "react";
import "./Cart.css";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Cart = () => {
  const {
    cartItems,
    food_list,
    removeFromCart,
    getTotalCartAmount,
    url,
    currency,
    deliveryCharge,
    addToCart,
    token,
  } = useContext(StoreContext);
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");

  const fetchRecommendations = useCallback(async () => {
    if (!token) {
      setRecommendations([]);
      return;
    }

    try {
      setRecLoading(true);
      setRecError("");
      const response = await axios.get(`${url}/api/recommendations/meals`, {
        headers: { token },
        params: { limit: 5 },
      });
      const recs = response.data?.data?.recommendations || [];
      setRecommendations(recs);
    } catch (error) {
      console.error("fetchRecommendations error:", error);
      setRecError("Unable to load recommendations right now.");
    } finally {
      setRecLoading(false);
    }
  }, [token, url]);

  const handleAddRecommendedItem = async (foodId) => {
    if (!foodId) return;
    try {
      await addToCart(foodId);
      toast.success("Added recommended item to cart");
    } catch (error) {
      console.error("handleAddRecommendedItem error:", error);
      toast.error("Unable to add that item right now");
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecommendations();
    }
  }, [token, fetchRecommendations]);

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p> <p>Title</p> <p>Price</p> <p>Quantity</p> <p>Total</p>{" "}
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item, index) => {
          if (cartItems[item._id] > 0) {
            const imageUrl = item.image && item.image.data
                ? `data:${item.image.contentType};base64,${item.image.data}`
                : assets.default_food_image;
            return (
              <div key={index}>
                <div className="cart-items-title cart-items-item">
                  <img src={imageUrl} alt="" /> {/* <--- UPDATED SRC */}
                  <p>{item.name}</p>
                  <p>
                    {currency}{item.price}
                  </p>
                  
                  <div>{cartItems[item._id]}</div>
                
                  <p>
                    {currency}
                    {item.price * cartItems[item._id]}
                  </p>
                  
                  <p
                    className="cart-items-remove-icon"
                    onClick={() => removeFromCart(item._id)}
                  >
                    x
                  </p>
                </div>
                <hr />
              </div>
            );
          }
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>
                {currency}
                {getTotalCartAmount()}
              </p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>
                {currency}
                {getTotalCartAmount() === 0 ? 0 : deliveryCharge}
              </p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {currency}
                {getTotalCartAmount() === 0
                  ? 0
                  : getTotalCartAmount() + deliveryCharge}
              </b>
            </div>
          </div>
          <button onClick={() => navigate("/order")}>
            PROCEED TO CHECKOUT
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            <div className="cart-promocode-input">
              <input type="text" placeholder="promo code" />
              <button>Submit</button>
            </div>
          </div>
        </div>
      </div>
      <div className="cart-recommendations">
        <div className="cart-recommendations-header">
          <h2>Recommended for you</h2>
          <button
            type="button"
            className="cart-recommendations-refresh"
            onClick={fetchRecommendations}
            disabled={recLoading}
          >
            {recLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {recError && (
          <p className="cart-recommendations-status error">{recError}</p>
        )}
        {!recError && recLoading && (
          <p className="cart-recommendations-status">
            Loading personalized meals…
          </p>
        )}
        {!recLoading && !recError && recommendations.length === 0 && (
          <p className="cart-recommendations-status muted">
            We’ll personalize suggestions after a few orders.
          </p>
        )}
        <div className="cart-recommendations-list">
          {recommendations.map((rec) => {
            const displayPrice =
              rec.isSurplus && rec.surplusPrice ? rec.surplusPrice : rec.price;
            const highlightReason = rec.reasons?.[0];

            return (
              <div className="cart-recommendation-card" key={rec.foodId}>
                <div className="cart-recommendation-card-info">
                  <p className="cart-recommendation-name">{rec.name}</p>
                  <p className="cart-recommendation-meta">
                    {rec.category} · {currency}
                    {displayPrice}
                  </p>
                  {highlightReason && (
                    <p className="cart-recommendation-reason">
                      {highlightReason}
                    </p>
                  )}
                  {rec.isSurplus && (
                    <span className="cart-recommendation-pill">
                      Surplus deal
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="cart-recommendation-add"
                  onClick={() => handleAddRecommendedItem(rec.foodId)}
                >
                  Add
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Cart;
