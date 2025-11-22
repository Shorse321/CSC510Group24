import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">

        {/* Left Section */}
        <div className="footer-content-left">
          <img src={assets.logo} alt="ByteBite Logo" className="footer-logo" />
          <p>
            ByteBite brings you handcrafted meals from top chefs with speed and quality.
          </p>
          <div className="footer-social-icons">
            <img src={assets.linkedin_icon} alt="Facebook" />
            <img src={assets.linkedin_icon} alt="Twitter" />
            <img src={assets.linkedin_icon} alt="LinkedIn" />
          </div>
        </div>

        {/* Right Section */}
        <div className="footer-content-right">
          <h2>Get in Touch</h2>
          <ul>
            <li>+1-111-111-111</li>
            <li>contact@bytebite.com</li>
          </ul>
        </div>

      </div>

      <hr />

      <p className="footer-copyright">
        © 2025 bytebite.com — All Rights Reserved
      </p>
    </div>
  );
};

export default Footer;