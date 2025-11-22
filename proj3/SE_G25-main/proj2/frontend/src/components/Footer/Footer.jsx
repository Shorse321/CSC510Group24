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
            <img src={assets.facebook_icon} alt="Facebook" />
            <img src={assets.twitter_icon} alt="Twitter" />
            <img src={assets.linkedin_icon} alt="LinkedIn" />
          </div>
        </div>

         {/* Center Section */}
<div className="footer-content-center">
  <h2>Company</h2>
  <ul>
    <li>
      <a href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        Home
      </a>
    </li>

    <li>
      <a href="#explore-menu">
        Menu
      </a>
    </li>

    <li>
      <a href="#app-download">
        Mobile App
      </a>
    </li>

    <li>
      <a href="#footer">
        Contact Us
      </a>
    </li>
  </ul>
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