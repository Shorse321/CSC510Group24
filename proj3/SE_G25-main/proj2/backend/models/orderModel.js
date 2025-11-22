import mongoose from "mongoose";

const STATUS_VALUES = [
  "Food Processing",
  "Out for delivery",
  "Delivered",
  "Redistribute",
  "Cancelled",
  "Donated",
];

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },

  status: {
    type: String,
    enum: STATUS_VALUES,
    default: "Food Processing",
  },

  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false },

  // Track who claimed this order (if redistributed)
  claimedBy: { type: String, default: null },
  claimedAt: { type: Date, default: null },
  
  // Track original user (before claiming)
  originalUserId: { type: String, default: null },
  
  // Track if this order was cancelled by user
  cancelledByUser: { type: Boolean, default: false },
  
  // Track redistribution attempts
  redistributionCount: { type: Number, default: 0 },
  lastRedistributedAt: { type: Date, default: null },

  // Shelter assignment
  shelter: {
    id: String,
    name: String,
    contactEmail: String,
    contactPhone: String,
    address: Object,
  },
  donationNotified: { type: Boolean, default: false },
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;