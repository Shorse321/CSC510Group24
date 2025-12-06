import React, { useContext, useEffect, useState } from "react";
import "./Preferences.css";
import axios from "axios";
import { StoreContext } from "../../Context/StoreContext";
import toast from "react-hot-toast";

const Preferences = () => {
  const { url, token, food_list } = useContext(StoreContext);
  
  const [preferences, setPreferences] = useState({
    maxDistance: 10,
    minPrice: 0,
    maxPrice: 1000,
    preferredItems: [],
    notificationsEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get unique food items for the dropdown
  const uniqueFoodItems = [...new Set(food_list.map(item => item.name))].sort();

  // Fetch current preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await axios.get(
          url + "/api/user/preferences",
          { headers: { token } }
        );

        if (response.data.success) {
          setPreferences(response.data.data || {
            maxDistance: 10,
            minPrice: 0,
            maxPrice: 1000,
            preferredItems: [],
            notificationsEnabled: true,
          });
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
        toast.error("Failed to load preferences");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPreferences();
    }
  }, [token, url]);

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put(
        url + "/api/user/preferences",
        preferences,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Preferences saved successfully!");
      } else {
        toast.error(response.data.message || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Error saving preferences");
    } finally {
      setSaving(false);
    }
  };

  // Add preferred item
  const addPreferredItem = (itemName) => {
    if (!preferences.preferredItems.includes(itemName)) {
      setPreferences({
        ...preferences,
        preferredItems: [...preferences.preferredItems, itemName],
      });
    }
    setSearchTerm("");
  };

  // Remove preferred item
  const removePreferredItem = (itemName) => {
    setPreferences({
      ...preferences,
      preferredItems: preferences.preferredItems.filter(item => item !== itemName),
    });
  };

  // Filter food items based on search
  const filteredFoodItems = uniqueFoodItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !preferences.preferredItems.includes(item)
  );

  if (loading) {
    return <div className="preferences-loading">Loading preferences...</div>;
  }

  return (
    <div className="preferences-page">
      <div className="preferences-container">
        <h1>Order Notification Preferences</h1>
        <p className="preferences-subtitle">
          Customize what redistributed orders you want to be notified about
        </p>

        {/* Notifications Toggle */}
        <div className="preference-section">
          <h2>🔔 Notifications</h2>
          <div className="toggle-container">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={preferences.notificationsEnabled}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notificationsEnabled: e.target.checked,
                  })
                }
              />
              <span className="toggle-text">
                {preferences.notificationsEnabled
                  ? "Notifications Enabled"
                  : "Notifications Disabled"}
              </span>
            </label>
          </div>
        </div>

        {/* Distance Preference */}
        <div className="preference-section">
          <h2>📍 Maximum Distance</h2>
          <p className="section-description">
            Only notify me about orders within this distance
          </p>
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="50"
              value={preferences.maxDistance}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  maxDistance: parseInt(e.target.value),
                })
              }
              className="distance-slider"
            />
            <span className="slider-value">{preferences.maxDistance} km</span>
          </div>
        </div>

        {/* Price Range Preference */}
        <div className="preference-section">
          <h2>💰 Price Range</h2>
          <p className="section-description">
            Only notify me about orders within this price range
          </p>
          <div className="price-inputs">
            <div className="price-input-group">
              <label>Minimum Price ($)</label>
              <input
                type="number"
                min="0"
                value={preferences.minPrice}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    minPrice: parseInt(e.target.value) || 0,
                  })
                }
                className="price-input"
              />
            </div>
            <span className="price-separator">to</span>
            <div className="price-input-group">
              <label>Maximum Price ($)</label>
              <input
                type="number"
                min="0"
                value={preferences.maxPrice}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    maxPrice: parseInt(e.target.value) || 1000,
                  })
                }
                className="price-input"
              />
            </div>
          </div>
        </div>

        {/* Preferred Items */}
        <div className="preference-section">
          <h2>🍽️ Preferred Food Items</h2>
          <p className="section-description">
            Only notify me about orders containing these items (leave empty for all items)
          </p>

          {/* Search and Add Items */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for food items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && filteredFoodItems.length > 0 && (
              <div className="search-dropdown">
                {filteredFoodItems.slice(0, 10).map((item, index) => (
                  <div
                    key={index}
                    className="search-item"
                    onClick={() => addPreferredItem(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Items */}
          <div className="selected-items">
            {preferences.preferredItems.length === 0 ? (
              <p className="no-items">No preferred items selected (you'll receive all notifications)</p>
            ) : (
              preferences.preferredItems.map((item, index) => (
                <div key={index} className="selected-item">
                  <span>{item}</span>
                  <button
                    onClick={() => removePreferredItem(item)}
                    className="remove-item-btn"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="save-button"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
};

export default Preferences;