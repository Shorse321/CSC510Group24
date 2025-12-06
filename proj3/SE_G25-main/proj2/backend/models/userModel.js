import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cartData: { type: Object, default: {} },
  address: {
    formatted: { type: String }, // full human-readable address
    lat: { type: Number }, // latitude
    lng: { type: Number }, // longitude
  },
  preferences: {
    maxDistance: { type: Number, default: 10 }, // in kilometers
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 1000 },
    preferredItems: { type: [String], default: [] }, // array of food item names
    notificationsEnabled: { type: Boolean, default: true },
  },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;