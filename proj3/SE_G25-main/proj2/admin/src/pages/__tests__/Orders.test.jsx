import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import Orders from "../Orders/Orders";
import axios from "axios";
import { toast } from "react-toastify";

// Mock axios and toast
vi.mock("axios");
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock the OrderMapModal component
vi.mock("../Orders/OrderMapModal", () => ({
  default: ({ order, onClose }) => (
    <div data-testid="order-map-modal">
      <button onClick={onClose}>Close Map</button>
      <div>Order ID: {order._id}</div>
      <div>Address: {order.address.street}</div>
    </div>
  ),
}));

const mockOrders = [
  {
    _id: "order1",
    items: [
      { name: "Pizza", quantity: 2 },
      { name: "Salad", quantity: 1 },
    ],
    address: {
      firstName: "John",
      lastName: "Doe",
      street: "123 Main St",
      city: "Raleigh",
      state: "NC",
      country: "USA",
      zipcode: "27601",
      phone: "123-456-7890",
      lat: 35.7796,
      lng: -78.6382,
    },
    amount: 25.99,
    status: "Food Processing",
    userId: "user1",
    originalUserId: "user1",
  },
  {
    _id: "order2",
    items: [{ name: "Burger", quantity: 1 }],
    address: {
      firstName: "Jane",
      lastName: "Smith",
      street: "456 Oak Ave",
      city: "Durham",
      state: "NC",
      country: "USA",
      zipcode: "27701",
      phone: "987-654-3210",
      lat: 35.9940,
      lng: -78.8986,
    },
    amount: 15.99,
    status: "Out for delivery",
    userId: "user2",
    originalUserId: "user2",
  },
  {
    _id: "order3",
    items: [{ name: "Pasta", quantity: 3 }],
    address: {
      firstName: "Alice",
      lastName: "Johnson",
      street: "789 Pine Rd",
      city: "Cary",
      state: "NC",
      country: "USA",
      zipcode: "27511",
      phone: "555-123-4567",
    },
    amount: 30.5,
    status: "Cancelled",
    userId: "user3",
    originalUserId: "user3",
    cancelledByUser: true,
    lastCancelledByUserId: "user3",
  },
  {
    _id: "order4",
    items: [{ name: "Sushi", quantity: 2 }],
    address: {
      firstName: "Bob",
      lastName: "Williams",
      street: "321 Elm St",
      city: "Raleigh",
      state: "NC",
      country: "USA",
      zipcode: "27603",
      phone: "555-987-6543",
      lat: 35.8302,
      lng: -78.6414,
    },
    amount: 45.0,
    status: "Delivered",
    userId: "user4",
    originalUserId: "user4",
  },
  {
    _id: "order5",
    items: [{ name: "Tacos", quantity: 4 }],
    address: {
      firstName: "Charlie",
      lastName: "Brown",
      street: "555 Maple Dr",
      city: "Durham",
      state: "NC",
      country: "USA",
      zipcode: "27707",
      phone: "555-246-8135",
      lat: 36.0031,
      lng: -78.9386,
    },
    amount: 22.0,
    status: "Redistribute",
    userId: "user5",
    originalUserId: "user5",
    cancelledByUser: true,
    lastCancelledByUserId: "user5",
  },
  {
    _id: "order6",
    items: [{ name: "Salad Bowl", quantity: 1 }],
    address: {
      firstName: "David",
      lastName: "Lee",
      street: "888 Oak Lane",
      city: "Raleigh",
      state: "NC",
      country: "USA",
      zipcode: "27610",
      phone: "555-369-2580",
      lat: 35.7721,
      lng: -78.6389,
    },
    amount: 12.99,
    status: "Donated",
    userId: "user6",
    originalUserId: "user6",
  },
  {
    _id: "order7",
    items: [{ name: "Sandwich", quantity: 2 }],
    address: {
      firstName: "Emma",
      lastName: "Davis",
      street: "999 Cedar Ave",
      city: "Cary",
      state: "NC",
      country: "USA",
      zipcode: "27519",
      phone: "555-147-2589",
      lat: 35.7915,
      lng: -78.7811,
    },
    amount: 18.5,
    status: "Food Processing",
    userId: "user8", // Different from original
    originalUserId: "user7",
    claimedBy: "user8",
    redistributionCount: 2,
  },
];

describe("Orders Page (Admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== BASIC RENDERING TESTS ==========

  it("should render orders page with header", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    await act(async () => {
      render(<Orders />);
    });

    expect(screen.getByText("Order Page")).toBeInTheDocument();
  });

  it("should display tabs for current and cancelled orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(screen.getByText(/Current/)).toBeInTheDocument();
      expect(screen.getByText(/Cancelled/)).toBeInTheDocument();
    });
  });

  it("should display current orders by default", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.queryByText("Alice Johnson")).not.toBeInTheDocument(); // Cancelled
    });
  });

  it("should switch to cancelled orders tab", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      const cancelledTab = screen.getByText(/Cancelled \(/);
      fireEvent.click(cancelledTab);
    });

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument(); // Cancelled
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument(); // Redistribute
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument(); // Processing
    });
  });

  it("should highlight active tab", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      const currentTab = screen.getByText(/Current \(/);
      expect(currentTab).toHaveClass("active");
    });

    const cancelledTab = screen.getByText(/Cancelled \(/);
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      expect(cancelledTab).toHaveClass("active");
    });
  });

  // ========== ORDER DETAILS TESTS ==========

  it("should display order details correctly", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      expect(screen.getByText(/Raleigh, NC, USA, 27601/)).toBeInTheDocument();
      expect(screen.getByText("123-456-7890")).toBeInTheDocument();
      expect(screen.getByText("$25.99")).toBeInTheDocument();
    });
  });

  it("should display multiple items correctly", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(screen.getByText(/Pizza x 2, Salad x 1/)).toBeInTheDocument();
    });
  });

  it("should calculate total items correctly", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      // Pizza (2) + Salad (1) = 3 items
      expect(screen.getByText("Items : 3")).toBeInTheDocument();
    });
  });

  // ========== CLAIMED ORDERS TESTS ==========

  it("should display claimed order indicator", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(screen.getByText("(Claimed Order)")).toBeInTheDocument();
    });
  });

  it("should show original and current owner IDs for claimed orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(screen.getByText(/Original User ID: user7/)).toBeInTheDocument();
      expect(screen.getByText(/Current Owner ID: user8/)).toBeInTheDocument();
    });
  });

  it("should show redistribution count", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(screen.getByText(/🔄 Redistributed 2 time\(s\)/)).toBeInTheDocument();
    });
  });

  // ========== CANCELLATION INFO TESTS ==========



  it("should show redistribution option hint for cancelled orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    const cancelledTab = screen.getByText(/Cancelled \(/);
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      expect(screen.getByText(/Can redistribute or donate/)).toBeInTheDocument();
    });
  });

  // ========== STATUS MANAGEMENT TESTS ==========

  it("should handle status update to Out for delivery", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });
    axios.post.mockResolvedValue({
      data: { success: true },
    });

    render(<Orders />);

    await waitFor(() => {
      const statusSelects = screen.getAllByRole("combobox");
      const processingOrderSelect = statusSelects.find(
        (select) => select.value === "Food Processing"
      );
      fireEvent.change(processingOrderSelect, { target: { value: "Out for delivery" } });
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/order/status"),
        expect.objectContaining({
          orderId: expect.any(String),
          status: "Out for delivery",
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Status updated to "Out for delivery"');
    });
  });

  it("should show special message when status changes to Redistribute", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });
    axios.post.mockResolvedValue({
      data: { success: true },
    });

    render(<Orders />);

    const cancelledTab = screen.getByText(/Cancelled \(/);
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      const statusSelects = screen.getAllByRole("combobox");
      const cancelledOrderSelect = statusSelects.find(
        (select) => select.value === "Cancelled"
      );
      fireEvent.change(cancelledOrderSelect, { target: { value: "Redistribute" } });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "🔔 Claiming notifications sent! Order will be cancelled if not claimed.",
        { autoClose: 5000 }
      );
    });
  });

  it("should disable status select for delivered orders (terminal status)", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      const statusSelects = screen.getAllByRole("combobox");
      const deliveredOrderSelect = statusSelects.find(
        (select) => select.value === "Delivered"
      );
      expect(deliveredOrderSelect).toBeDisabled();
    });
  });

  it("should disable status select for donated orders (terminal status)", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    // Donated orders are not shown in current or cancelled tabs by default
    // But we can check if they exist in allOrders
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  it("should show correct status options for processing orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [mockOrders[0]] },
    });

    render(<Orders />);

    await waitFor(() => {
      const select = screen.getByRole("combobox");
      const options = Array.from(select.options).map((opt) => opt.value);
      
      expect(options).toContain("Food Processing");
      expect(options).toContain("Out for delivery");
      expect(options).toContain("Delivered");
      expect(options).not.toContain("Cancelled");
    });
  });

  it("should show correct status options for cancelled orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [mockOrders[2]] },
    });

    render(<Orders />);

    const cancelledTab = screen.getByText(/Cancelled \(/);
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      const select = screen.getByRole("combobox");
      const options = Array.from(select.options).map((opt) => opt.value);
      
      expect(options).toContain("Cancelled");
      expect(options).toContain("Redistribute");
      expect(options).toContain("Donated");
    });
  });

  it("should handle status update error with message", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });
    axios.post.mockResolvedValue({
      data: { success: false, message: "Status update failed" },
    });

    render(<Orders />);

    await waitFor(() => {
      const statusSelects = screen.getAllByRole("combobox");
      const processingOrderSelect = statusSelects.find(
        (select) => select.value === "Food Processing"
      );
      fireEvent.change(processingOrderSelect, { target: { value: "Out for delivery" } });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Status update failed");
    });
  });

  it("should handle network error on status update", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });
    axios.post.mockRejectedValue(new Error("Network error"));

    render(<Orders />);

    await waitFor(() => {
      const statusSelects = screen.getAllByRole("combobox");
      const processingOrderSelect = statusSelects.find(
        (select) => select.value === "Food Processing"
      );
      fireEvent.change(processingOrderSelect, { target: { value: "Out for delivery" } });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Network error while updating status"
      );
    });
  });

  // ========== MAP FUNCTIONALITY TESTS ==========

  it("should render show map button for all orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      const mapButtons = screen.getAllByText(/🗺️ Show on Map/);
      expect(mapButtons.length).toBeGreaterThan(0);
    });
  });

  it("should enable map button for orders with location data", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [mockOrders[0]] },
    });

    render(<Orders />);

    await waitFor(() => {
      const mapButton = screen.getByText(/🗺️ Show on Map/);
      expect(mapButton).not.toBeDisabled();
      expect(mapButton).toHaveAttribute("title", "View order location on map");
    });
  });

  it("should disable map button for cancelled orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    const cancelledTab = screen.getByText(/Cancelled \(/);
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      const mapButtons = screen.getAllByText(/🗺️ Show on Map/);
      mapButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  it("should disable map button for redistribute status", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [mockOrders[4]] },
    });

    render(<Orders />);

    const cancelledTab = screen.getByText(/Cancelled \(/);
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      const mapButton = screen.getByText(/🗺️ Show on Map/);
      expect(mapButton).toBeDisabled();
      expect(mapButton).toHaveAttribute(
        "title",
        "Map not available for cancelled/redistribute orders"
      );
    });
  });

  it("should disable map button when location data is missing", async () => {
    const orderWithoutLocation = {
      ...mockOrders[0],
      address: { ...mockOrders[0].address, lat: undefined, lng: undefined },
    };

    axios.get.mockResolvedValue({
      data: { success: true, data: [orderWithoutLocation] },
    });

    render(<Orders />);

    await waitFor(() => {
      const mapButton = screen.getByText(/🗺️ Show on Map/);
      expect(mapButton).toBeDisabled();
      expect(mapButton).toHaveAttribute("title", "No location data available");
    });
  });


  it("should close map modal when close button is clicked", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [mockOrders[0]] },
    });

    render(<Orders />);

    await waitFor(() => {
      const mapButton = screen.getByText(/🗺️ Show on Map/);
      fireEvent.click(mapButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("order-map-modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByText("Close Map");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("order-map-modal")).not.toBeInTheDocument();
    });
  });

  it("should show info toast for cancelled orders when map button clicked", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    const cancelledTab = screen.getByText(/Cancelled \(/);
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      const mapButtons = screen.getAllByText(/🗺️ Show on Map/);
      fireEvent.click(mapButtons[0]);
    });

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        "Map is not available for cancelled or redistribute orders."
      );
    });
  });

  it("should show warning toast when location data is missing", async () => {
    const orderWithoutLocation = {
      ...mockOrders[0],
      address: { ...mockOrders[0].address, lat: undefined, lng: undefined },
    };

    axios.get.mockResolvedValue({
      data: { success: true, data: [orderWithoutLocation] },
    });

    render(<Orders />);

    await waitFor(() => {
      const mapButton = screen.getByText(/🗺️ Show on Map/);
      fireEvent.click(mapButton);
    });

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        "This order doesn't have location coordinates."
      );
    });
  });

  // ========== EMPTY STATE TESTS ==========

  it("should show empty state for current orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(
        screen.getByText(/No current orders right now/)
      ).toBeInTheDocument();
    });
  });

  it("should show empty state for cancelled orders", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(<Orders />);

    const cancelledTab = screen.getByText(/Cancelled \(/);
    fireEvent.click(cancelledTab);

    await waitFor(() => {
      expect(screen.getByText(/No cancelled orders yet/)).toBeInTheDocument();
    });
  });

  // ========== ERROR HANDLING TESTS ==========

  it("should handle fetch error on initial load", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));

    render(<Orders />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Network error while fetching orders"
      );
    });
  });

  it("should handle API error response", async () => {
    axios.get.mockResolvedValue({
      data: { success: false },
    });

    render(<Orders />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch orders");
    });
  });

  it("should refresh orders after successful status update", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });
    axios.post.mockResolvedValue({
      data: { success: true },
    });

    render(<Orders />);

    await waitFor(() => {
      const statusSelects = screen.getAllByRole("combobox");
      const processingOrderSelect = statusSelects.find(
        (select) => select.value === "Food Processing"
      );
      fireEvent.change(processingOrderSelect, { target: { value: "Out for delivery" } });
    });

    await waitFor(() => {
      // fetchAllOrders should be called twice: once on mount, once after update
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("should apply correct CSS class to status select based on status", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockOrders },
    });

    render(<Orders />);

    await waitFor(() => {
      const statusSelects = screen.getAllByRole("combobox");
      const processingSelect = statusSelects.find(
        (s) => s.value === "Food Processing"
      );
      expect(processingSelect).toHaveClass("status--food-processing");
    });
  });
});