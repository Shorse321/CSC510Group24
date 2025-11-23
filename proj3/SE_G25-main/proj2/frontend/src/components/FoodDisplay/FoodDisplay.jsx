import React, { useContext } from "react";
import "./FoodDisplay.css";
import FoodItem from "../FoodItem/FoodItem";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);

  // Helper function to render a card
  const renderFoodItem = (item, index) => {
    const imageUrl =
      item.image && item.image.data
        ? `data:${item.image.contentType};base64,${item.image.data}`
        : assets.default_food_image;

    return (
      <FoodItem
        key={item._id || index}
        id={item._id}
        name={item.name}
        desc={item.description}
        price={item.price}
        image={imageUrl}
        model3D={item.model3D}
        isSurplus={item.isSurplus}
        surplusQuantity={item.surplusQuantity}
      />
    );
  };

  return (
    <div className="food-display" id="food-display">
      
      {/* --- SECTION 1: BULK DEALS (Always show at top if Category is All or Bulk) --- */}
      {(category === "All" || category === "Bulk Deals") && (
        <>
          <h2 className="section-title">📦 Bulk Value Packs</h2>
          <div className="food-display-list">
            {food_list
              .filter((item) => item.category === "Bulk Deals")
              .map(renderFoodItem)}
          </div>
          {/* Show separator only if there are bulk items */}
          {food_list.some(item => item.category === "Bulk Deals") && <hr className="section-separator" />}
        </>
      )}

      {/* --- SECTION 2: STANDARD MENU --- */}
      <h2 className="section-title">Explore Our Menu</h2>
      <div className="food-display-list">
        {food_list
          // Filter 1: Exclude Bulk Deals (they are already shown above)
          .filter((item) => item.category !== "Bulk Deals")
          // Filter 2: Apply User Category Selection (Salad, Rolls, etc.)
          .filter((item) => category === "All" || item.category === category)
          .map(renderFoodItem)}
      </div>
    </div>
  );
};

export default FoodDisplay;