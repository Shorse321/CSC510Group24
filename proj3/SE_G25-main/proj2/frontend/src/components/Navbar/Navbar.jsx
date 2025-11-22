import React, { useContext, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";
import { ThemeContext } from "../../Context/ThemeContext";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
  };

  // New function to handle section navigation
  const handleSectionClick = (sectionId, menuKey) => {
    setMenu(menuKey);
    if (location.pathname !== "/") {
      // Navigate to home with state
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      // Already on home, scroll directly
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={`navbar ${theme}`}>
      {/* Logo */}
      <Link to="/">
        <img className="logo" src={assets.logo} alt="ByteBite Logo" />
      </Link>

      {/* Navigation Menu */}
      <ul className="navbar-menu">
        <Link
          to="/"
          onClick={() => setMenu("home")}
          className={menu === "home" ? "active" : ""}
        >
          Home
        </Link>
        <button
          onClick={() => handleSectionClick("explore-menu", "menu")}
          className={menu === "menu" ? "active" : ""}
        >
          Menu
        </button>
        <button
          onClick={() => handleSectionClick("app-download", "mob-app")}
          className={menu === "mob-app" ? "active" : ""}
        >
          Mobile App
        </button>
        <button
          onClick={() => handleSectionClick("footer", "contact")}
          className={menu === "contact" ? "active" : ""}
        >
          Contact Us
        </button>
      </ul>

      {/* Right Section */}
      <div className="navbar-right">
        {/* Search */}
        <div className="navbar-search">
          <input
            type="text"
            placeholder="Search dishes..."
            onFocus={() =>
              handleSectionClick("explore-menu", "menu")
            }
          />
        </div>

        {/* Cart */}
        <Link to="/cart" className="navbar-search-icon">
          <img src={assets.basket_icon} alt="Cart" />
          <div className={getTotalCartAmount() > 0 ? "dot" : ""}></div>
        </Link>

        {/* Theme Toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          <div className={`toggle-track ${theme}`}>
            <div
              className={`toggle-thumb ${theme === "dark" ? "on" : ""}`}
            ></div>
          </div>
          <span className="toggle-text">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </button>

        {/* Login / Profile */}
        {!token ? (
          <button onClick={() => setShowLogin(true)}>Sign In</button>
        ) : (
          <div className="navbar-profile">
            <img src={assets.profile_icon} alt="Profile" />
            <ul className="navbar-profile-dropdown">
              <li onClick={() => navigate("/myorders")}>
                <img src={assets.bag_icon} alt="Orders" /> <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="Logout" /> <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;