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
  
  // Track original user (the very first person who placed the order)
  originalUserId: { type: String, default: null },
  
  // Store original address (before any claims)
  originalAddress: { type: Object, default: null },
  
  // Track if this order was cancelled by user
  cancelledByUser: { type: Boolean, default: false },
  
  // NEW: Track the MOST RECENT user who cancelled this order
  // This is the user who should be EXCLUDED from claim notifications
  lastCancelledByUserId: { type: String, default: null },
  
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