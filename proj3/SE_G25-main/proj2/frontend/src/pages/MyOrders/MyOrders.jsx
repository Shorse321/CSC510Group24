import React, { useContext, useEffect, useState, useRef } from "react";
import "./MyOrders.css";
import axios from "axios";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";
import { useSocket } from "../../Context/SocketContext";

const MyOrders = () => {
  const [data, setData] = useState([]);
  const { url, token, currency } = useContext(StoreContext);
  const socket = useSocket();
  const orderRefreshHandlerRef = useRef(null); // Store handler reference

  // Decode token to get userId (if not available in StoreContext)
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
    const response = await axios.post(
      url + "/api/order/userorders",
      {},
      { headers: { token } }
    );
    setData(response.data.data);
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.post(
        url + "/api/order/cancel_order",
        { orderId },
        { headers: { token } }
      );

      if (response.data.success) {
        fetchOrders();
      } else {
        alert(response.data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.log(error);
      alert("Error cancelling order");
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // Listen for order cancellations to refresh the list
  useEffect(() => {
    if (socket) {
      // Create a named function reference
      orderRefreshHandlerRef.current = () => {
        console.log("📋 MyOrders: Refreshing orders due to cancellation");
        fetchOrders();
      };

      socket.on("orderCancelled", orderRefreshHandlerRef.current);

      return () => {
        // Remove only THIS specific handler, not all handlers
        if (orderRefreshHandlerRef.current) {
          socket.off("orderCancelled", orderRefreshHandlerRef.current);
        }
      };
    }
  }, [socket]);

  // Calculate progress percentage based on order creation time
  const calculateProgress = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    const elapsed = currentTime - createdTime;
    const progress = Math.min((elapsed / twoMinutes) * 100, 100);
    return progress;
  };

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
      let status = "Preparing"; // default status
      const currentUserId = getUserId();
      const isClaimedByMe = order.claimedBy?.toString() === currentUserId;
      const isCancelled = order.status === "Cancelled" || order.status === "Redistribute";

      if (isCancelled) status = "Cancelled";
      else if (order.status === "Claimed") status = isClaimedByMe ? "Out for Delivery" : "Preparing";
      else if (order.status === "Delivered") status = "Delivered";

      return (
        <div key={index} className={`my-orders-order ${isCancelled ? "cancelled-order" : ""}`}>
          <img src={assets.parcel_icon} alt="" />
          <p>
            {order.items.map((item, idx) =>
              idx === order.items.length - 1
                ? `${item.name} x ${item.quantity}`
                : `${item.name} x ${item.quantity}, `
            )}
          </p>
          <p>{currency}{order.amount}.00</p>
          <p>Items: {order.items.length}</p>

          {/* Order Status */}
          <p className={`order-status ${status.toLowerCase().replace(/\s/g, "-")}`}>
            {status}
          </p>

          {/* Cancel button */}
          <button
            onClick={() => cancelOrder(order._id)}
            disabled={isCancelled || status === "Delivered"}
            className={isCancelled ? "cancel" : ""}
          >
            {isCancelled ? "Cancelled" : "Cancel Order"}
          </button>
        </div>
      );
    })}
  </div>
</div>
  );
};

export default MyOrders;
