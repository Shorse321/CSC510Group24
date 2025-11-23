import React, { useEffect, useMemo, useState } from "react";
import "./Orders.css";
import { toast } from "react-toastify";
import axios from "axios";
import { assets, url, currency } from "../../assets/assets";

// All possible statuses
const STATUS = {
  PROCESSING: "Food Processing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  REDISTRIBUTE: "Redistribute",
  CANCELLED: "Cancelled",
  DONATED: "Donated",
};

// Terminal statuses that can't be changed
const TERMINAL = new Set([STATUS.DELIVERED, STATUS.DONATED]);

/**
 * Orders - Admin page for managing all orders
 * Displays orders in tabs (current vs cancelled) with status update functionality
 * Shows current owner's information (not original user if order was claimed)
 * @returns {JSX.Element} Orders management interface with tabs and status controls
 */
const Order = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("current");

  /**
   * Fetches all orders from the backend API
   * @returns {Promise<void>}
   */
  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`);
      if (response.data.success) {
        const data = response.data.data.reverse();
        setAllOrders(data);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (err) {
      toast.error("Network error while fetching orders");
    }
  };

  // Counts for tab labels
  const counts = useMemo(() => {
    const cancelled = allOrders.filter((o) => o.status === STATUS.CANCELLED).length;
    const current = allOrders.filter(
      (o) => o.status !== STATUS.CANCELLED && o.status !== STATUS.DONATED
    ).length;

    return { cancelled, current };
  }, [allOrders]);

  // Filter according to active tab
  useEffect(() => {
    if (activeTab === "cancelled") {
      // Show both Cancelled and Redistribute in cancelled tab
      setOrders(
        allOrders.filter(
          (o) => o.status === STATUS.CANCELLED || o.status === STATUS.REDISTRIBUTE
        )
      );
    } else {
      // current tab: hide cancelled, redistribute, and donated orders
      setOrders(
        allOrders.filter(
          (o) => 
            o.status !== STATUS.CANCELLED && 
            o.status !== STATUS.DONATED &&
            o.status !== STATUS.REDISTRIBUTE
        )
      );
    }
  }, [activeTab, allOrders]);

  /**
   * Get available status options based on current order status and cancellation state
   */
  const getAvailableStatuses = (order) => {
    const currentStatus = order.status || STATUS.PROCESSING;
    
    // If order was cancelled by user
    if (order.cancelledByUser || currentStatus === STATUS.CANCELLED) {
      return [STATUS.CANCELLED, STATUS.REDISTRIBUTE, STATUS.DONATED];
    }
    
    // For active orders, admin can only progress the order
    if (currentStatus === STATUS.PROCESSING) {
      return [STATUS.PROCESSING, STATUS.OUT_FOR_DELIVERY, STATUS.DELIVERED];
    }
    
    if (currentStatus === STATUS.OUT_FOR_DELIVERY) {
      return [STATUS.OUT_FOR_DELIVERY, STATUS.DELIVERED];
    }
    
    if (currentStatus === STATUS.REDISTRIBUTE) {
      return [STATUS.REDISTRIBUTE, STATUS.CANCELLED, STATUS.DONATED];
    }
    
    // Terminal statuses
    if (currentStatus === STATUS.DELIVERED || currentStatus === STATUS.DONATED) {
      return [currentStatus];
    }
    
    return [currentStatus];
  };

  /**
   * Handles order status updates
   */
  const statusHandler = async (event, orderId) => {
    const nextStatus = event.target.value;
    
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: nextStatus,
      });
      
      if (response.data.success) {
        await fetchAllOrders();
        
        if (nextStatus === STATUS.REDISTRIBUTE) {
          toast.success(
            "🔔 Claiming notifications sent! Order will be cancelled if not claimed.",
            { autoClose: 5000 }
          );
        } else {
          toast.success(`Status updated to "${nextStatus}"`);
        }
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("Network error while updating status");
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <div className="order add">
      {/* Header + horizontal tabs */}
      <div className="orders-toolbar">
        <h3>Order Page</h3>
        <div className="orders-tabs">
          <button
            className={`tab-btn ${activeTab === "current" ? "active" : ""}`}
            onClick={() => setActiveTab("current")}
          >
            Current ({counts.current})
          </button>
          <button
            className={`tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
            onClick={() => setActiveTab("cancelled")}
          >
            Cancelled ({counts.cancelled})
          </button>
        </div>
      </div>

      {/* Empty-state */}
      {orders.length === 0 && (
        <div className="empty-hint">
          {activeTab === "cancelled"
            ? "No cancelled orders yet."
            : "No current orders right now."}
        </div>
      )}

      <div className="order-list">
        {orders.map((order) => {
          const availableStatuses = getAvailableStatuses(order);
          const isTerminal = TERMINAL.has(order.status);
          
          // Determine who currently owns this order
          const isClaimedOrder = order.claimedBy && order.claimedBy !== order.originalUserId;
          const currentOwnerId = order.userId; // This is always the current owner
          
          return (
            <div key={order._id} className="order-item">
              <img src={assets.parcel_icon} alt="" />
              <div>
                <p className="order-item-food">
                  {order.items.map((item, idx) =>
                    idx === order.items.length - 1
                      ? `${item.name} x ${item.quantity}`
                      : `${item.name} x ${item.quantity}, `
                  )}
                </p>
                
                {/* Show current owner info */}
                <p className="order-item-name">
                  {order.address.firstName + " " + order.address.lastName}
                  {isClaimedOrder && (
                    <span style={{ 
                      fontSize: "11px", 
                      color: "#28a745", 
                      marginLeft: "8px",
                      fontWeight: "bold" 
                    }}>
                      (Claimed Order)
                    </span>
                  )}
                </p>
                
                <div className="order-item-address">
                  <p>{order.address.street + ","}</p>
                  <p>
                    {order.address.city +
                      ", " +
                      order.address.state +
                      ", " +
                      order.address.country +
                      ", " +
                      order.address.zipcode}
                  </p>
                </div>
                <p className="order-item-phone">{order.address.phone}</p>

                {/* Show ownership info */}
                {order.originalUserId && order.originalUserId !== currentOwnerId && (
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#666", 
                    marginTop: "5px",
                    fontStyle: "italic"
                  }}>
                    📋 Original User ID: {order.originalUserId}
                    <br />
                    👤 Current Owner ID: {currentOwnerId}
                  </div>
                )}

                {/* Show cancellation info */}
                {order.cancelledByUser && (order.status === STATUS.CANCELLED || order.status === STATUS.REDISTRIBUTE) && (
                  <div className="shelter-assigned" style={{ 
                    background: "#fff3cd", 
                    color: "#856404", 
                    padding: "5px 10px", 
                    borderRadius: "4px",
                    marginTop: "5px"
                  }}>
                    ⚠️ <b>Cancelled by User</b>
                    <br />
                    <small>Last canceller ID: {order.lastCancelledByUserId || order.originalUserId || order.userId}</small>
                    {order.status === STATUS.CANCELLED && (
                      <>
                        <br />
                        <small>Can redistribute or donate</small>
                      </>
                    )}
                  </div>
                )}
                
                {/* Show redistribution count if applicable */}
                {order.redistributionCount > 0 && (
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#666", 
                    marginTop: "5px" 
                  }}>
                    🔄 Redistributed {order.redistributionCount} time(s)
                  </div>
                )}
              </div>
              <p>Items : {order.items.reduce((total, item) => total + item.quantity, 0)}</p>
              <p>
                {currency}
                {order.amount}
              </p>

              <select
                onChange={(e) => statusHandler(e, order._id)}
                value={order.status || STATUS.PROCESSING}
                disabled={isTerminal}
                className={`status-select status--${(
                  order.status || STATUS.PROCESSING
                )
                  .split(" ")
                  .join("-")
                  .toLowerCase()}`}
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Order;