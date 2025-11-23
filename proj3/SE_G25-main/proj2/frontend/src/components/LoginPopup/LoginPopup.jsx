import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const { setToken, url, loadCartData } = useContext(StoreContext);
  const [currState, setCurrState] = useState("Sign Up");

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    addressFormatted: "",
    addressLat: "",
    addressLng: "",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  /**
   * Handle address typing with improved geocoding
   * Uses Nominatim with better parameters for US-focused results
   */
  const handleAddressChange = async (e) => {
    const query = e.target.value;
    setData({ ...data, addressFormatted: query });

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      // Use Nominatim with country bias and better parameters
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: query,
            format: "json",
            addressdetails: 1,
            limit: 10, // Get more results
            countrycodes: "us", // Prioritize US addresses (change to your country)
            // You can also add: viewbox and bounded params for geographic bounds
          },
          headers: {
            "User-Agent": "FoodDeliveryApp/1.0", // Required by Nominatim
          },
        }
      );

      // Filter and deduplicate results
      const uniqueResults = res.data.filter((place, index, self) =>
        index === self.findIndex((p) => p.display_name === place.display_name)
      );

      setSuggestions(uniqueResults);
    } catch (err) {
      console.error("Error fetching address suggestions:", err);
      toast.error("Could not fetch address suggestions");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  /**
   * When user selects a suggestion from dropdown
   */
  const handleSelectSuggestion = (place) => {
    setData({
      ...data,
      addressFormatted: place.display_name,
      addressLat: parseFloat(place.lat),
      addressLng: parseFloat(place.lon),
    });
    setSuggestions([]);
  };

  const onLogin = async (e) => {
    e.preventDefault();

    // Validate address for Sign Up
    if (currState === "Sign Up") {
      if (!data.addressLat || !data.addressLng) {
        toast.error("Please select a valid address from the suggestions");
        return;
      }
    }

    let new_url = url;
    if (currState === "Login") {
      new_url += "/api/user/login";
    } else {
      new_url += "/api/user/register";
    }

    let payload = { ...data };
    if (currState === "Sign Up") {
      payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        address: {
          formatted: data.addressFormatted,
          lat: parseFloat(data.addressLat),
          lng: parseFloat(data.addressLng),
        },
      };
    }

    try {
      const response = await axios.post(new_url, payload);
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        loadCartData({ token: response.data.token });
        setShowLogin(false);
        toast.success(currState === "Login" ? "Logged in successfully!" : "Account created successfully!");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error while logging in or signing up.");
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>

        <div className="login-popup-inputs">
          {currState === "Sign Up" ? (
            <>
              <input
                name="name"
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                placeholder="Your name"
                required
              />

              {/* Address autocomplete input */}
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Enter your address (e.g., 123 Main St, Raleigh, NC)"
                  value={data.addressFormatted}
                  onChange={handleAddressChange}
                  required
                  autoComplete="off"
                  style={{ width: "100%" }}
                />
                
                {/* Loading indicator */}
                {isLoadingSuggestions && (
                  <div style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "12px",
                    color: "#666"
                  }}>
                    Loading...
                  </div>
                )}

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <ul
                    style={{
                      listStyle: "none",
                      background: "#fff",
                      border: "1px solid #ccc",
                      padding: 0,
                      margin: 0,
                      position: "absolute",
                      width: "100%",
                      zIndex: 1000,
                      maxHeight: "200px",
                      overflowY: "auto",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      borderRadius: "4px",
                    }}
                  >
                    {suggestions.map((s) => (
                      <li
                        key={s.place_id}
                        style={{
                          padding: "10px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          fontSize: "14px",
                          transition: "background 0.2s",
                        }}
                        onClick={() => handleSelectSuggestion(s)}
                        onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                        onMouseLeave={(e) => e.target.style.background = "#fff"}
                      >
                        <div style={{ fontWeight: "500", marginBottom: "2px" }}>
                          {s.address?.road || s.address?.neighbourhood || "Address"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {s.display_name}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* No results message */}
                {!isLoadingSuggestions && data.addressFormatted.length >= 3 && suggestions.length === 0 && (
                  <div style={{
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "5px"
                  }}>
                    No results found. Try a more specific address (include street, city, state).
                  </div>
                )}
              </div>

              {/* Show selected coordinates (optional, for debugging) */}
              {data.addressLat && data.addressLng && (
                <div style={{ fontSize: "11px", color: "#28a745", marginTop: "5px" }}>
                  ✓ Address validated ({data.addressLat}, {data.addressLng})
                </div>
              )}
            </>
          ) : null}

          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
          />
        </div>

        <button type="submit">
          {currState === "Login" ? "Login" : "Create account"}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>

        {currState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;