import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import MyOrders from "../MyOrders/MyOrders";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";

vi.mock("axios");

// Mock useSocket hook
vi.mock("../../Context/SocketContext", () => ({
  useSocket: vi.fn(() => null),
}));

const mockStoreContext = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMifQ.test",
  url: "http://localhost:4000",
  currency: "$",
};

const renderWithProviders = (component, contextOverrides = {}) => {
  const contextValue = { ...mockStoreContext, ...contextOverrides };
  return render(
    <BrowserRouter>
      <StoreContext.Provider value={contextValue}>
        {component}
      </StoreContext.Provider>
    </BrowserRouter>
  );
};

describe("MyOrders Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ==================== BASIC RENDERING TESTS ====================
  
  it("should render my orders page with title", async () => {
    axios.post.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderWithProviders(<MyOrders />);

    expect(screen.getByText("My Orders")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:4000/api/order/userorders",
        {},
        { headers: { token: mockStoreContext.token } }
      );
    });
  });

  it("should handle empty orders array", async () => {
    axios.post.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderWithProviders(<MyOrders />);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    
    const orderItems = screen.queryByText(/x \d+/);
    expect(orderItems).not.toBeInTheDocument();
  });

  it("should not fetch orders when token is missing", () => {
    const contextWithoutToken = { token: null, url: "http://localhost:4000", currency: "$" };

    renderWithProviders(<MyOrders />, contextWithoutToken);

    expect(axios.post).not.toHaveBeenCalled();
  });

  // Basic test placeholder - can be expanded when implementation is stable
  it("should handle component mount and unmount", () => {
    axios.post.mockResolvedValue({
      data: { success: true, data: [] },
    });

    const { unmount } = renderWithProviders(<MyOrders />);
    
    expect(screen.getByText("My Orders")).toBeInTheDocument();
    
    unmount();
  });
});