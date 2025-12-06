import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Home from "../Home/Home";

// Mock the child components
vi.mock("../../components/Header/Header", () => ({
  default: () => <div data-testid="header">Header Component</div>,
}));

vi.mock("../../components/ExploreMenu/ExploreMenu", () => ({
  default: ({ category, setCategory }) => (
    <div data-testid="explore-menu">Explore Menu - Category: {category}</div>
  ),
}));

vi.mock("../../components/FoodDisplay/FoodDisplay", () => ({
  default: ({ category }) => (
    <div data-testid="food-display">Food Display - Category: {category}</div>
  ),
}));

vi.mock("../../components/AppDownload/AppDownload", () => ({
  default: () => <div data-testid="app-download">App Download Component</div>,
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Home", () => {
  it("should render all child components", () => {
    renderWithRouter(<Home />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("explore-menu")).toBeInTheDocument();
    expect(screen.getByTestId("food-display")).toBeInTheDocument();
    expect(screen.getByTestId("app-download")).toBeInTheDocument();
  });

  it('should set default category to "All"', () => {
    renderWithRouter(<Home />);

    const exploreMenu = screen.getByTestId("explore-menu");
    expect(exploreMenu).toHaveTextContent("Category: All");
  });

  it("should pass category to child components", () => {
    renderWithRouter(<Home />);

    const exploreMenu = screen.getByTestId("explore-menu");
    const foodDisplay = screen.getByTestId("food-display");

    expect(exploreMenu).toHaveTextContent("Category: All");
    expect(foodDisplay).toHaveTextContent("Category: All");
  });
});