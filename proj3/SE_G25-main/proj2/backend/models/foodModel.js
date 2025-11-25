import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: {
    data: Buffer,
    contentType: String,
  },
  model3D: {
    data: Buffer,
    contentType: String,
  },
  category: { type: String, required: true },

  // --- NEW CHANGES START HERE ---
  isSurplus: { type: Boolean, default: false }, // Defaults to "not surplus"
  surplusPrice: { type: Number, default: 0 },   // The discounted price
  surplusQuantity: { type: Number, default: 0 } // How many are available
  // --- NEW CHANGES END HERE ---
});

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);
export default foodModel;