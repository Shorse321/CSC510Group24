import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ShelterHistory from "../ShelterHistory/ShelterHistory";
import axios from "axios";
import { toast } from "react-toastify";

vi.mock("axios");
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock the ShelterHistoryMapModal component
vi.mock("../ShelterHistory/ShelterHistoryMapModal", () => ({
  default: ({ reroute, onClose }) => (
    <div data-testid="map-modal">
      <button onClick={onClose}>Close Modal</button>
      <div>Order: {reroute.orderId}</div>
    </div>
  ),
}));

const mockReroutes = [
  {
    _id: "r1",
    orderId: "order123456789",
    order: { orderNumber: "ORD-001" },
    shelter: { name: "Hope Shelter" },
    shelterName: "Hope Shelter",
    shelterContactEmail: "contact@hope.org",
    shelterContactPhone: "+1-555-0100",
    shelterAddress: {
      lat: 35.7796,
      lng: -78.6382,
    },
    items: [
      { name: "Pizza", qty: 2 },
      { name: "Salad", qty: 1 },
    ],
    total: 25.99,
    createdAt: "2024-12-06T10:00:00.000Z",
  },
  {
    _id: "r2",
    orderId: "order987654321",
    order: { orderNumber: "ORD-002" },
    shelter: { name: "Community Shelter" },
    shelterName: "Community Shelter",
    shelterContactEmail: "info@community.org",
    items: [{ name: "Pasta", qty: 3 }],
    total: 15.5,
    createdAt: "2024-12-05T15:30:00.000Z",
  },
  {
    _id: "r3",
    orderId: "order111222333",
    order: { orderNumber: "ORD-003" },
    shelter: { name: "Safe Haven" },
    shelterName: "Safe Haven",
    items: [{ name: "Burger", qty: 5 }],
    total: null, // Test null total
    createdAt: null, // Test null date
  },
];

const mockOrderList = [
  {
    _id: "order123456789",
    orderNumber: "ORD-001",
    address: {
      street: "123 Main St",
      city: "Raleigh",
      lat: 35.7796,
      lng: -78.6382,
    },
  },
];

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("ShelterHistory Page (Admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render shelter history page with header", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockReroutes, total: 3, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(
        screen.getByText("Shelter Redistribution History")
      ).toBeInTheDocument();
    });
  });

  it("should display loading state initially", () => {
    axios.get.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithRouter(<ShelterHistory />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });


  it("should filter records by order number", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockReroutes, total: 3, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Filter by order \/ shelter/i);
    fireEvent.change(searchInput, { target: { value: "ORD-001" } });

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
      expect(screen.queryByText("Community Shelter")).not.toBeInTheDocument();
    });
  });

  it("should filter records by shelter name", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockReroutes, total: 3, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(screen.getByText("Community Shelter")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Filter by order \/ shelter/i);
    fireEvent.change(searchInput, { target: { value: "community" } });

    await waitFor(() => {
      expect(screen.getByText("Community Shelter")).toBeInTheDocument();
      expect(screen.queryByText("Hope Shelter")).not.toBeInTheDocument();
    });
  });

  it("should handle pagination correctly", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: mockReroutes,
        total: 50,
        page: 1,
      },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });

    // Test Next button
    const nextButton = screen.getByRole("button", { name: /Next/i });
    expect(nextButton).not.toBeDisabled();
    
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/reroutes"),
        expect.objectContaining({
          params: expect.objectContaining({ page: 2, limit: 20 }),
        })
      );
    });
  });

  it("should disable prev button on first page", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: mockReroutes,
        total: 50,
        page: 1,
      },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const prevButton = screen.getByRole("button", { name: /Prev/i });
      expect(prevButton).toBeDisabled();
    });
  });

  it("should handle empty results gracefully", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [], total: 0, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(
        screen.getByText(/No redistribution records yet/i)
      ).toBeInTheDocument();
    });
  });

  it("should handle API error with message", async () => {
    axios.get.mockResolvedValue({
      data: { success: false, message: "Database error" },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Database error");
      expect(screen.getByText(/Error: Database error/)).toBeInTheDocument();
    });
  });

  it("should handle network error", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Network error while fetching shelter history"
      );
    });
  });

  it("should display multiple items as chips", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockReroutes, total: 3, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(screen.getByText(/Pizza/)).toBeInTheDocument();
      expect(screen.getByText(/Salad/)).toBeInTheDocument();
      expect(screen.getByText(/× 2/)).toBeInTheDocument();
      expect(screen.getByText(/× 1/)).toBeInTheDocument();
    });
  });

  it("should handle null/undefined values gracefully", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: [mockReroutes[2]], // Has null total and createdAt
        total: 1,
        page: 1,
      },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      // Should show "—" for null values
      const cells = screen.getAllByText("—");
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  it("should render Back to Shelters link", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockReroutes, total: 3, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const backLink = screen.getByRole("link", { name: /Back to Shelters/i });
      expect(backLink).toHaveAttribute("href", "/shelters");
    });
  });

  // ========== NEW MAP FUNCTIONALITY TESTS ==========

  it("should render map buttons for all records", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockReroutes, total: 3, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const mapButtons = screen.getAllByText(/🗺️ Map/);
      expect(mapButtons.length).toBe(3);
    });
  });

  it("should enable map button when location data is available", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [mockReroutes[0]], total: 1, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const mapButton = screen.getByRole("button", { name: /🗺️ Map/i });
      expect(mapButton).not.toBeDisabled();
      expect(mapButton).toHaveAttribute("title", "View donation journey on map");
    });
  });

  it("should disable map button when location data is missing", async () => {
    const rerouteWithoutLocation = {
      ...mockReroutes[1],
      shelterAddress: null,
    };

    axios.get.mockResolvedValue({
      data: { success: true, data: [rerouteWithoutLocation], total: 1, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const mapButton = screen.getByRole("button", { name: /🗺️ Map/i });
      expect(mapButton).toBeDisabled();
      expect(mapButton).toHaveAttribute("title", "Location data not available");
    });
  });

  it("should open map modal when map button is clicked", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: [mockReroutes[0]], total: 1, page: 1 },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockOrderList },
      });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const mapButton = screen.getByRole("button", { name: /🗺️ Map/i });
      fireEvent.click(mapButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("map-modal")).toBeInTheDocument();
      expect(screen.getByText(/Order: order123456789/)).toBeInTheDocument();
    });
  });

  it("should fetch order details when opening map", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: [mockReroutes[0]], total: 1, page: 1 },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockOrderList },
      });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const mapButton = screen.getByRole("button", { name: /🗺️ Map/i });
      fireEvent.click(mapButton);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/order/list")
      );
    });
  });


  it("should show warning if order details not found", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: [mockReroutes[0]], total: 1, page: 1 },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: [] }, // Empty order list
      });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const mapButton = screen.getByRole("button", { name: /🗺️ Map/i });
      fireEvent.click(mapButton);
    });

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith("Order details not found.");
    });
  });

  it("should handle error when fetching order details for map", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: [mockReroutes[0]], total: 1, page: 1 },
      })
      .mockRejectedValueOnce(new Error("API Error"));

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const mapButton = screen.getByRole("button", { name: /🗺️ Map/i });
      fireEvent.click(mapButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load order details for map."
      );
    });
  });

  it("should close map modal when close is clicked", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: [mockReroutes[0]], total: 1, page: 1 },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockOrderList },
      });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      const mapButton = screen.getByRole("button", { name: /🗺️ Map/i });
      fireEvent.click(mapButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("map-modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: /Close Modal/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("map-modal")).not.toBeInTheDocument();
    });
  });

  it("should not show pagination when total records fit in one page", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockReroutes.slice(0, 2), total: 2, page: 1 },
    });

    renderWithRouter(<ShelterHistory />);

    await waitFor(() => {
      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });
  });
});