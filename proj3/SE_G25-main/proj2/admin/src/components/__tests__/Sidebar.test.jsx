import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";

// Helper to render with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Sidebar Component", () => {
  it("renders the sidebar container", () => {
    const { container } = renderWithRouter(<Sidebar />);
    const sidebar = container.querySelector(".sidebar");
    expect(sidebar).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText("Add Items")).toBeInTheDocument();
    expect(screen.getByText("List Items")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Shelters")).toBeInTheDocument();
    expect(screen.getByText("Shelter History")).toBeInTheDocument();
  });

  it("renders SVG icon for Shelters and Shelter History", () => {
    renderWithRouter(<Sidebar />);
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it("renders images for Add Items, List Items, Orders", () => {
    renderWithRouter(<Sidebar />);
    const imgs = document.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(3);
    // Optional: check src attributes if assets are mocked
  });
});