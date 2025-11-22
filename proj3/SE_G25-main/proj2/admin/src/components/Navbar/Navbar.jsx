import React from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";

const Navbar = () => {
  const scrollToFooter = () => {
    const footer = document.getElementById("footer");
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="navbar">
      {/* Left Section */}
      <div className="navbar-left">
        <img className="logo" src={assets.logo} alt="Logo" />

        <div className="navbar-links">
          <span onClick={scrollToFooter}>About Us</span>
          <span onClick={scrollToFooter}>Contact Us</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="navbar-right">
        <img
          className="profile"
          src={assets.profile_image}
          alt="Profile"
        />
      </div>
    </div>
  );
};

export default Navbar;