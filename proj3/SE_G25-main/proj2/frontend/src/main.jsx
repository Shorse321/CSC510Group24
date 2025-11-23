import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import StoreContextProvider from "./Context/StoreContext";
import { ThemeProvider } from "./Context/ThemeContext.jsx";
import { SocketProvider } from "./Context/SocketContext.jsx";
import { StoreContext } from "./Context/StoreContext";

// Wrapper component to access StoreContext
const AppWithSocket = () => {
  const { url, token } = React.useContext(StoreContext);

  // Decode userId from token
  const getUserId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (error) {
      return null;
    }
  };

  const userId = getUserId();

  return (
    <SocketProvider url={url} userId={userId}>
      <App />
    </SocketProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <StoreContextProvider>
          <AppWithSocket />
        </StoreContextProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);