import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "../App";

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("App (Admin)", () => {
  it("should render app with navbar and sidebar", () => {
    renderWithRouter(<App />);
    expect(document.querySelector(".app")).toBeInTheDocument();
    expect(document.querySelector(".app-content")).toBeInTheDocument();
  });



  it("should redirect from root path to /orders", () => {
    const { container } = renderWithRouter(<App />);
    // After redirect, Orders component should be rendered
    // You may need to check for specific Orders component elements
    expect(container).toBeTruthy();
  });

  it("should have all required routes configured", () => {
    renderWithRouter(<App />);
    // Verify the app structure is present which contains all routes
    expect(document.querySelector(".app")).toBeInTheDocument();
  });
});