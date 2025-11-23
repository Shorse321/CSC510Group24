import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../Orders/OrderMapModal.css"; // Import from Orders folder

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
 * ShelterHistoryMapModal - Shows donation journey from last owner to shelter
 * @param {Object} reroute - Reroute record with shelter and order details
 * @param {Function} onClose - Callback to close modal
 */
const ShelterHistoryMapModal = ({ reroute, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const shelterLat =
  reroute?.shelterAddress?.lat ||
  reroute?.shelter?.address?.lat;

const shelterLng =
  reroute?.shelterAddress?.lng ||
  reroute?.shelter?.address?.lng;

if (!shelterLat || !shelterLng) return;

    if (!shelterLat || !shelterLng) return;

    // Initialize map centered on shelter
    const map = L.map(mapRef.current).setView([shelterLat, shelterLng], 12);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const journeyPoints = [];
    const labels = [];

    // 1. Original order location (if available from order details)
    const order = reroute.orderDetails;
    if (order && order.address && order.address.lat && order.address.lng) {
      const orderLat = order.address.lat;
      const orderLng = order.address.lng;
      
      journeyPoints.push([orderLat, orderLng]);
      labels.push({
        position: [orderLat, orderLng],
        label: "📍 Last Order Location",
        color: "#dc3545",
        details: `${order.address.firstName || ''} ${order.address.lastName || ''}<br/>${order.address.street || ''}`,
      });
    }

    // 2. Shelter location (always present)
    journeyPoints.push([shelterLat, shelterLng]);
    labels.push({
      position: [shelterLat, shelterLng],
      label: "🏠 Shelter (Donated)",
      color: "#ffc107",
      details: `<strong>${reroute.shelterName || reroute.shelter?.name || 'Shelter'}</strong><br/>
        ${reroute.shelterAddress.street || ''}<br/>
        ${reroute.shelterAddress.city || ''}, ${reroute.shelterAddress.state || ''}<br/>
        📧 ${reroute.shelterContactEmail || ''}<br/>
        📞 ${reroute.shelterContactPhone || ''}`,
    });

    // Create custom icons
    const createIcon = (color) => {
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
    labels.forEach((point) => {
      const marker = L.marker(point.position, {
        icon: createIcon(point.color),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <strong>${point.label}</strong><br/>
          ${point.details}
        </div>
      `);
    });

    // Draw path if we have both points
    if (journeyPoints.length === 2) {
      const polyline = L.polyline(journeyPoints, {
        color: "#6c757d",
        weight: 3,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(map);

      // Calculate distance
      const distance = calculateDistance(
        journeyPoints[0][0],
        journeyPoints[0][1],
        journeyPoints[1][0],
        journeyPoints[1][1]
      );

      // Add distance label at midpoint
      const midpoint = [
        (journeyPoints[0][0] + journeyPoints[1][0]) / 2,
        (journeyPoints[0][1] + journeyPoints[1][1]) / 2,
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
          ">${distance.toFixed(2)} km</div>`,
          iconSize: [60, 20],
        }),
      }).addTo(map);

      // Fit map to show all points
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    } else {
      // Only shelter location - center on it
      map.setView([shelterLat, shelterLng], 13);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [reroute]);

  if (!reroute || !reroute.shelterAddress || !reroute.shelterAddress.lat || !reroute.shelterAddress.lng) {
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
            <p>This donation record doesn't have valid location coordinates.</p>
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
          <h3>🏠 Donation Journey to Shelter</h3>
          <button className="map-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="map-info">
          <div className="map-info-item">
            <strong>Order ID:</strong> {reroute.orderId?.slice(-8)}
          </div>
          <div className="map-info-item">
            <strong>Shelter:</strong> {reroute.shelterName || reroute.shelter?.name}
          </div>
          <div className="map-info-item">
            <strong>Total Value:</strong> ${reroute.total || 0}
          </div>
          <div className="map-info-item">
            <strong>Items:</strong> {reroute.items?.length || 0}
          </div>
        </div>

        <div ref={mapRef} className="map-container"></div>

        <div className="map-legend">
          {reroute.orderDetails && (
            <div className="legend-item">
              <span className="legend-dot" style={{ background: "#dc3545" }}></span>
              Last Order Location
            </div>
          )}
          <div className="legend-item">
            <span className="legend-dot" style={{ background: "#ffc107" }}></span>
            Shelter (Donated)
          </div>
          {reroute.orderDetails && (
            <div className="legend-item">
              <span className="legend-line"></span>
              Donation Journey
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

export default ShelterHistoryMapModal;