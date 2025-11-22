import React, { useContext, useEffect, useState, useRef } from "react";
import "./MyOrders.css";
import axios from "axios";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";
import { useSocket } from "../../Context/SocketContext";
import toast from "react-hot-toast";

const MyOrders = () => {
  const [data, setData] = useState([]);
  const { url, token, currency } = useContext(StoreContext);
  const socket = useSocket();
  const orderRefreshHandlerRef = useRef(null);

  // Decode token to get userId
  const getUserId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (error) {
      return null;
    }
  };

  const currentUserId = getUserId();

  const fetchOrders = async () => {
    try {
      console.log("🔍 Fetching orders...");
      const response = await axios.post(
        url + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        console.error("Invalid response format:", response.data);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setData([]);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.post(
        url + "/api/order/cancel_order",
        { orderId, userId: currentUserId },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order cancelled successfully");
        fetchOrders();
      } else {
        toast.error(response.data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error cancelling order");
    }
  };

  const claimOrder = async (orderId) => {
    try {
      const response = await axios.post(
        url + "/api/order/claim",
        { orderId, userId: currentUserId },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("🎉 Order claimed successfully!");
        
        // Emit socket event to stop notifications for other users
        if (socket) {
          socket.emit("claimOrder", { orderId, userId: currentUserId });
        }
        
        // Refresh orders
        fetchOrders();
      } else {
        toast.error(response.data.message || "Failed to claim order");
      }
    } catch (error) {
      console.error("Error claiming order:", error);
      toast.error("Error claiming order");
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // Listen for order cancellations and claims to refresh the list
  useEffect(() => {
    if (socket) {
      orderRefreshHandlerRef.current = () => {
        console.log("📋 MyOrders: Refreshing orders");
        fetchOrders();
      };

      socket.on("orderCancelled", orderRefreshHandlerRef.current);
      socket.on("orderClaimed", orderRefreshHandlerRef.current);

      return () => {
        if (orderRefreshHandlerRef.current) {
          socket.off("orderCancelled", orderRefreshHandlerRef.current);
          socket.off("orderClaimed", orderRefreshHandlerRef.current);
        }
      };
    }
  }, [socket]);

  // Update progress bars every second
  const [, forceUpdate] = useState();
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => {
          // Determine if I'm the original user who placed this order
          const originalUserId = order.originalUserId || order.userId;
          const isMyOriginalOrder = originalUserId === currentUserId;
          const isClaimedByMe = order.claimedBy === currentUserId;
          const isClaimedByOther = order.claimedBy && order.claimedBy !== currentUserId;
          
          // Determine what status to show and what actions are available
          let displayStatus = order.status;
          let canCancel = false;
          let canClaim = false;
          let isCancelled = false;
          let showOrder = true;

          // CASE 1: I'm the original user and I cancelled it
          if (isMyOriginalOrder && order.cancelledByUser) {
            displayStatus = "Cancelled";
            isCancelled = true;
            canCancel = false;
            canClaim = false;
            // ALWAYS show cancelled orders to the original user, even if claimed by others
          }
          // CASE 2: Order is in Redistribute status
          else if (order.status === "Redistribute") {
            if (isMyOriginalOrder) {
              // Original user sees it as cancelled
              displayStatus = "Cancelled";
              isCancelled = true;
              canClaim = false;
            } else {
              // Other users can claim it
              displayStatus = "Available to Claim";
              canClaim = true;
            }
          }
          // CASE 3: Order was cancelled but now claimed by someone else
          else if (order.status === "Cancelled" && isClaimedByOther) {
            if (isMyOriginalOrder) {
              // Original user still sees it as cancelled
              displayStatus = "Cancelled";
              isCancelled = true;
            } else {
              // This shouldn't appear for other users
              showOrder = false;
            }
          }
          // CASE 4: Regular cancelled order
          else if (order.status === "Cancelled") {
            displayStatus = "Cancelled";
            isCancelled = true;
          }
          // CASE 5: Active order (Processing or Out for delivery)
          else if (order.status === "Food Processing" || order.status === "Out for delivery") {
            if (isClaimedByMe || (isMyOriginalOrder && !isClaimedByOther)) {
              displayStatus = order.status;
              canCancel = true;
            } else if (isMyOriginalOrder && isClaimedByOther) {
              // Someone else claimed my cancelled order - show as cancelled
              displayStatus = "Cancelled";
              isCancelled = true;
            }
          }
          // CASE 6: Terminal statuses
          else if (order.status === "Delivered" || order.status === "Donated") {
            if (isMyOriginalOrder || isClaimedByMe) {
              displayStatus = order.status;
            } else {
              showOrder = false;
            }
          }

          // Don't render orders that shouldn't be shown
          if (!showOrder) return null;

          return (
            <div 
              key={index} 
              className={`my-orders-order ${isCancelled ? "cancelled-order" : ""} ${canClaim ? "claimable-order" : ""}`}
            >
              <img src={assets.parcel_icon} alt="" />
              <p>
                {order.items.map((item, idx) =>
                  idx === order.items.length - 1
                    ? `${item.name} x ${item.quantity}`
                    : `${item.name} x ${item.quantity}, `
                )}
              </p>
              <p>{currency}{order.amount}.00</p>
              <p>Items : {order.items.reduce((total, item) => total + item.quantity, 0)}</p>

              {/* Order Status */}
              <p className={`order-status ${displayStatus.toLowerCase().replace(/\s/g, "-")}`}>
                {displayStatus}
              </p>

              {/* Action Buttons */}
              {canClaim && (
                <button
                  onClick={() => claimOrder(order._id)}
                  className="claim-button"
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    fontWeight: "bold",
                    border: "none",
                    padding: "10px 20px",
                    cursor: "pointer",
                    borderRadius: "5px"
                  }}
                >
                  🎯 Claim This Order
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => cancelOrder(order._id)}
                  className="cancel-button"
                >
                  Cancel Order
                </button>
              )}

              {/* Show info if this was my order and someone claimed it */}
              {isCancelled && isMyOriginalOrder && isClaimedByOther && order.cancelledByUser && (
                <p style={{ fontSize: "13px", color: "#666", fontStyle: "italic", margin: "5px 0" }}>
                  (Claimed by another user)
                </p>
              )}

              {/* Show cancelled button only for cancelled orders that weren't claimed by others */}
              {isCancelled && !(isMyOriginalOrder && isClaimedByOther && order.cancelledByUser) && (
                <button disabled className="cancelled-button">
                  Cancelled
                </button>
              )}

              {!canCancel && !canClaim && !isCancelled && (
                <button disabled className="track-button">
                  Track Order
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;