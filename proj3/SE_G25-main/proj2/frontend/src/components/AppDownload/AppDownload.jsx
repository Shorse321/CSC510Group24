import React from "react";
import "./AppDownload.css";

const AppDownload = () => {
  return (
    <div className="app-download" id="app-download">
      <div className="app-card">
        <h2> ByteBite Mobile App – Coming Soon</h2>

        <p className="subtext">
          Our mobile experience is currently under development.
        </p>

        <p className="desc">
          Soon, you’ll be able to order food, track deliveries and enjoy an
          ultra-smooth experience directly through our mobile app.
        </p>

        <div className="divider" />

        <p className="contact">
          Customer Support: <span>contact@bytebite.com</span>
        </p>

        <p className="note">
          Stay tuned — the ByteBite app is on its way!
        </p>
      </div>
    </div>
  );
};

export default AppDownload;