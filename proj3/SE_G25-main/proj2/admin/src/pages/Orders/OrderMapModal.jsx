import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./OrderMapModal.css";

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * OrderMapModal - Shows order delivery journey on map
 * @param {Object} order - Order object with address and claim history
 * @param {Function} onClose - Callback to close modal
 */
const OrderMapModal = ({ order, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!order || !order.address) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(
      [order.address.lat, order.address.lng],
      12
    );
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles (free, no API key needed)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Build journey points
    const journeyPoints = [];
    const labels = [];

    // Check if order is donated to shelter
    const isDonated = order.status === "Donated" && order.shelter;

    // 1. Original address (if order was claimed)
    if (order.originalAddress && order.claimedBy) {
      const origLat = order.originalAddress.lat;
      const origLng = order.originalAddress.lng;
      
      if (origLat && origLng) {
        journeyPoints.push([origLat, origLng]);
        labels.push({
          position: [origLat, origLng],
          label: "📍 Original Order Location",
          color: "#dc3545",
          details: `${order.originalAddress.firstName || ''} ${order.originalAddress.lastName || ''}<br/>${order.originalAddress.street || ''}`,
        });
      }
    }

    // 2. Current address (order owner or last canceller)
    const currentLat = order.address.lat;
    const currentLng = order.address.lng;
    
    if (currentLat && currentLng && !isDonated) {
      journeyPoints.push([currentLat, currentLng]);
      
      const isClaimed = order.claimedBy && order.originalAddress;
      labels.push({
        position: [currentLat, currentLng],
        label: isClaimed ? "📍 Current Owner Location" : "📍 Order Location",
        color: isClaimed ? "#28a745" : "#007bff",
        details: `${order.address.firstName} ${order.address.lastName}<br/>${order.address.street}`,
      });
    }

    // 3. Shelter location (if donated)
    if (isDonated && order.shelter.address) {
      const shelterLat = order.shelter.address.lat;
      const shelterLng = order.shelter.address.lng;
      
      if (shelterLat && shelterLng) {
        journeyPoints.push([shelterLat, shelterLng]);
        labels.push({
          position: [shelterLat, shelterLng],
          label: "🏠 Shelter Location (Donated)",
          color: "#ffc107",
          details: `<strong>${order.shelter.name}</strong><br/>${order.shelter.address.street || ''}<br/>📧 ${order.shelter.contactEmail || ''}<br/>📞 ${order.shelter.contactPhone || ''}`,
        });
      }
    }

    // Create custom icons
    const createIcon = (color, label) => {
      return L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });
    };

    // Add markers
    labels.forEach((point, idx) => {
      const marker = L.marker(point.position, {
        icon: createIcon(point.color, point.label),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif;">
          <strong>${point.label}</strong><br/>
          ${point.details}
          ${idx > 0 ? `<br/><small>Stop ${idx + 1}</small>` : ''}
        </div>
      `);
    });

    // Draw dotted path if there are multiple points
    if (journeyPoints.length > 1) {
      const polyline = L.polyline(journeyPoints, {
        color: "#6c757d",
        weight: 3,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(map);

      // Calculate and show distance
      const totalDistance = calculateDistance(
        journeyPoints[0][0],
        journeyPoints[0][1],
        journeyPoints[journeyPoints.length - 1][0],
        journeyPoints[journeyPoints.length - 1][1]
      );

      // Add distance label at midpoint
      const midpoint = [
        (journeyPoints[0][0] + journeyPoints[journeyPoints.length - 1][0]) / 2,
        (journeyPoints[0][1] + journeyPoints[journeyPoints.length - 1][1]) / 2,
      ];

      L.marker(midpoint, {
        icon: L.divIcon({
          className: "distance-label",
          html: `<div style="
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
            border: 2px solid #6c757d;
            font-weight: bold;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">${totalDistance.toFixed(2)} km</div>`,
          iconSize: [60, 20],
        }),
      }).addTo(map);

      // Fit map to show all points
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    } else if (journeyPoints.length === 1) {
      // Single point - just center on it
      map.setView(journeyPoints[0], 13);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order]);

  if (!order || !order.address || !order.address.lat || !order.address.lng) {
    return (
      <div className="map-modal-overlay" onClick={onClose}>
        <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="map-modal-header">
            <h3>⚠️ No Location Data</h3>
            <button className="map-modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>This order doesn't have valid location coordinates.</p>
            <button className="map-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h3>📍 Order Delivery Journey</h3>
          <button className="map-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="map-info">
          <div className="map-info-item">
            <strong>Order ID:</strong> {order._id.slice(-8)}
          </div>
          <div className="map-info-item">
            <strong>Status:</strong> {order.status}
          </div>
          {order.claimedBy && (
            <div className="map-info-item">
              <strong>🔄 Claimed Order:</strong> Yes
              {order.redistributionCount > 0 && (
                <span> ({order.redistributionCount}x)</span>
              )}
            </div>
          )}
          {order.status === "Donated" && order.shelter && (
            <div className="map-info-item" style={{ color: "#ff9800", fontWeight: "bold" }}>
              🏠 Donated to: {order.shelter.name}
            </div>
          )}
        </div>

        <div ref={mapRef} className="map-container"></div>

        <div className="map-legend">
          {order.originalAddress && order.claimedBy && (
            <div className="legend-item">
              <span className="legend-dot" style={{ background: "#dc3545" }}></span>
              Original Location
            </div>
          )}
          {order.status !== "Donated" && (
            <div className="legend-item">
              <span className="legend-dot" style={{ background: order.claimedBy && order.originalAddress ? "#28a745" : "#007bff" }}></span>
              Current Location
            </div>
          )}
          {order.status === "Donated" && order.shelter && (
            <div className="legend-item">
              <span className="legend-dot" style={{ background: "#ffc107" }}></span>
              Shelter (Donated)
            </div>
          )}
          {((order.claimedBy && order.originalAddress) || (order.status === "Donated" && order.shelter)) && (
            <div className="legend-item">
              <span className="legend-line"></span>
              Journey Path
            </div>
          )}
        </div>

        <button className="map-close-btn" onClick={onClose}>
          Close Map
        </button>
      </div>
    </div>
  );
};

export default OrderMapModal;