import React, { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";

const Cart = () => {
  const {
    cartItems,
    food_list,
    removeFromCart,
    getTotalCartAmount,
    url,
    currency,
    deliveryCharge,
  } = useContext(StoreContext);
  const navigate = useNavigate();

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
            // --- NEW LOGIC START ---
            // 1. Check if it's a surplus item
            const isSurplus = item.isSurplus;
            
            // 2. Use surplusPrice if true, otherwise use regular price
            const price = isSurplus ? item.surplusPrice : item.price;
            
            // 3. Fix Image URL (Handle Base64 data vs URLs)
            const imageUrl =
              item.image && item.image.data
                ? `data:${item.image.contentType};base64,${item.image.data}`
                : assets.default_food_image;
            // --- NEW LOGIC END ---
            return (
              <div key={index}>
                <div className="cart-items-title cart-items-item">
                  <img src={imageUrl} alt="" /> {/* <--- UPDATED SRC */}
                  <p>{item.name}</p>
                  
                  {/* --- UPDATED PRICE DISPLAY --- */}
                  <p>
                    {currency}{price} {/* Uses the new 'price' variable */}
                    {isSurplus && <span style={{color: "green", fontSize: "12px", display: "block"}}>(On Sale)</span>}
                  </p>
                  
                  <div>{cartItems[item._id]}</div>
                  
                  {/* --- UPDATED TOTAL CALCULATION --- */}
                  <p>
                    {currency}
                    {price * cartItems[item._id]} {/* Uses 'price' instead of item.price */}
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
    </div>
  );
};

export default Cart;
