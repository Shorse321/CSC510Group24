import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Shelters from "../Shelters/Shelters";
import axios from "axios";
import { toast } from "react-toastify";

vi.mock("axios");
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

const mockShelters = [
  {
    _id: "shelter1",
    name: "Hope Shelter",
    contactName: "John Doe",
    contactEmail: "john@hope.org",
    contactPhone: "123-456-7890",
    capacity: 100,
    active: true,
    address: {
      street: "123 Main St",
      city: "Raleigh",
      state: "NC",
      zipcode: "27601",
    },
  },
  {
    _id: "shelter2",
    name: "Community Shelter",
    contactName: "Jane Smith",
    contactEmail: "jane@community.org",
    contactPhone: "987-654-3210",
    capacity: 150,
    active: true,
    address: {
      street: "456 Oak Ave",
      city: "Durham",
      state: "NC",
      zipcode: "27701",
    },
  },
  {
    _id: "shelter3",
    name: "Minimal Shelter",
    contactName: null,
    capacity: null,
    address: null,
  },
];

const mockCancelledOrders = [
  {
    _id: "order1",
    orderNumber: "ORD-001",
    status: "Cancelled",
    restaurantId: "rest1",
    items: [
      { name: "Pizza", quantity: 2 },
      { name: "Salad", quantity: 1 },
    ],
    amount: 25.99,
    address: {
      firstName: "Alice",
      lastName: "Johnson",
      street: "789 Elm St",
      city: "Raleigh",
      state: "NC",
      zipcode: "27603",
    },
  },
  {
    _id: "order2",
    orderNumber: "ORD-002",
    status: "Cancelled",
    restaurantId: "rest1",
    items: [{ name: "Burger", quantity: 3 }],
    amount: 18.5,
    address: {
      firstName: "Bob",
      lastName: "Smith",
      street: "321 Pine Rd",
      city: "Durham",
      state: "NC",
      zipcode: "27707",
    },
  },
  {
    _id: "order3",
    orderNumber: "ORD-003",
    status: "Cancelled",
    restaurantId: "rest1",
    items: [{ name: "Pasta", quantity: 1 }],
    amount: 12.0,
    address: {
      firstName: "Charlie",
      lastName: "Brown",
      street: "555 Maple Dr",
      city: "Cary",
      state: "NC",
      zipcode: "27511",
    },
  },
];

const mockAllOrders = [
  ...mockCancelledOrders,
  {
    _id: "order4",
    status: "Delivered",
    restaurantId: "rest1",
    items: [{ name: "Sushi", quantity: 2 }],
    amount: 30.0,
  },
  {
    _id: "order5",
    status: "Processing",
    restaurantId: "rest2",
    items: [{ name: "Tacos", quantity: 4 }],
    amount: 20.0,
  },
];

describe("Shelters Page (Admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  // ========== BASIC RENDERING TESTS ==========

  it("should render shelters page with title", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockShelters },
    });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Partner Shelters")).toBeInTheDocument();
    });
  });

  it("should display loading state initially", () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Shelters />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("should display list of shelters after loading", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockShelters },
    });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
      expect(screen.getByText("Community Shelter")).toBeInTheDocument();
    });
  });

  it("should display shelter details correctly", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [mockShelters[0]] },
    });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
      expect(screen.getByText("Contact: John Doe")).toBeInTheDocument();
      expect(screen.getByText("Capacity: 100")).toBeInTheDocument();
      expect(screen.getByText("123 Main St, Raleigh, NC, 27601")).toBeInTheDocument();
    });
  });

  it("should handle shelter with minimal data", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [mockShelters[2]] },
    });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Minimal Shelter")).toBeInTheDocument();
      // Should not crash when optional fields are null
      expect(screen.queryByText(/Contact:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Capacity:/)).not.toBeInTheDocument();
    });
  });

  it("should handle error when fetching shelters fails", async () => {
    axios.get.mockResolvedValue({
      data: { success: false, message: "Database error" },
    });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Database error/)).toBeInTheDocument();
    });
  });

  it("should handle network error when fetching shelters", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error while fetching shelters/)).toBeInTheDocument();
    });
  });

  it("should display message when no shelters found", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(<Shelters />);

    await waitFor(() => {
      expect(
        screen.getByText(/No shelters found. Seed from the backend and refresh./)
      ).toBeInTheDocument();
    });
  });

  it("should render redistribute button for each shelter", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, data: mockShelters },
    });

    render(<Shelters />);

    await waitFor(() => {
      const buttons = screen.getAllByText("Redistribute Orders");
      expect(buttons.length).toBe(3);
    });
  });

  // ========== MODAL OPENING TESTS ==========

  it("should open modal when redistribute button is clicked", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Redistribute Orders → Hope Shelter/)).toBeInTheDocument();
    });
  });

  it("should fetch orders when modal opens", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/order/list")
      );
    });
  });

  it("should display loading state in modal while fetching orders", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Loading orders…")).toBeInTheDocument();
    });
  });

  it("should filter and display only cancelled orders", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    localStorage.setItem("restaurantId", "rest1");

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      // Should show 3 cancelled orders for rest1
      expect(screen.getByText(/Pizza x 2, Salad x 1/)).toBeInTheDocument();
      expect(screen.getByText(/Burger x 3/)).toBeInTheDocument();
      expect(screen.getByText(/Pasta x 1/)).toBeInTheDocument();

      // Should NOT show delivered or other restaurant orders
      expect(screen.queryByText(/Sushi/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tacos/)).not.toBeInTheDocument();
    });
  });

  it("should show all cancelled orders when no restaurantId in localStorage", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    // Don't set restaurantId

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      // Should show all 3 cancelled orders regardless of restaurant
      expect(screen.getByText(/Pizza x 2, Salad x 1/)).toBeInTheDocument();
      expect(screen.getByText(/Burger x 3/)).toBeInTheDocument();
      expect(screen.getByText(/Pasta x 1/)).toBeInTheDocument();
    });
  });

  it("should display message when no cancelled orders available", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText("No orders available for redistribution.")
      ).toBeInTheDocument();
    });
  });

  it("should handle error when fetching orders fails", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: false, message: "Orders fetch failed" },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Orders fetch failed");
    });
  });

  it("should handle network error when fetching orders", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Network error while fetching orders"
      );
    });
  });

  // ========== ORDER SELECTION TESTS ==========

  it("should allow selecting individual orders", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is "Select all", rest are individual orders
    fireEvent.click(checkboxes[1]); // Select first order

    // Button text should update
    await waitFor(() => {
      expect(screen.getByText(/Assign 1 selected/)).toBeInTheDocument();
    });
  });

  it("should toggle order selection on checkbox click", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(1);
    });

    const checkboxes = screen.getAllByRole("checkbox");
    
    // Select first order
    fireEvent.click(checkboxes[1]);
    await waitFor(() => {
      expect(checkboxes[1]).toBeChecked();
    });

    // Deselect first order
    fireEvent.click(checkboxes[1]);
    await waitFor(() => {
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  it("should select all orders when select all checkbox is clicked", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Select all \(3\)/)).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/Assign 3 selected/)).toBeInTheDocument();
    });
  });

 
  it("should disable assign button when no orders selected", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      const assignButton = screen.getByText(/Assign  selected/);
      expect(assignButton).toBeDisabled();
    });
  });

  // ========== ORDER ASSIGNMENT TESTS ==========

  it("should assign selected orders to shelter", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    axios.post.mockResolvedValue({
      data: { success: true },
    });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // Select first order
    });

    // Mock the second API call that happens after assignment
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: mockAllOrders },
    });

    const assignButton = screen.getByText(/Assign 1 selected/);
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/order/assign-shelter"),
        expect.objectContaining({
          orderId: "order1",
          shelterId: "shelter1",
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Assigned 1 order(s) to Hope Shelter"
      );
    });
  });

  it("should assign multiple selected orders", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    axios.post.mockResolvedValue({
      data: { success: true },
    });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
      fireEvent.click(selectAllCheckbox); // Select all 3 orders
    });

    // Mock the refresh call
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: mockAllOrders },
    });

    const assignButton = screen.getByText(/Assign 3 selected/);
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(3);
      expect(toast.success).toHaveBeenCalledWith(
        "Assigned 3 order(s) to Hope Shelter"
      );
    });
  });


  it("should handle partial assignment failures", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    // Mock mixed success/failure responses
    axios.post
      .mockResolvedValueOnce({ data: { success: true } })
      .mockResolvedValueOnce({ data: { success: false } })
      .mockResolvedValueOnce({ data: { success: true } });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
      fireEvent.click(selectAllCheckbox);
    });

    axios.get.mockResolvedValueOnce({
      data: { success: true, data: mockAllOrders },
    });

    const assignButton = screen.getByText(/Assign 3 selected/);
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Assigned 2 order(s) to Hope Shelter"
      );
      expect(toast.error).toHaveBeenCalledWith("1 order(s) failed to assign");
    });
  });

  // ========== MODAL CLOSING TESTS ==========

  it("should close modal when close button is clicked", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Redistribute Orders → Hope Shelter/)).toBeInTheDocument();
    });

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/Redistribute Orders → Hope Shelter/)
      ).not.toBeInTheDocument();
    });
  });

  it("should close modal when clicking overlay", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Redistribute Orders → Hope Shelter/)).toBeInTheDocument();
    });

    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(
        screen.queryByText(/Redistribute Orders → Hope Shelter/)
      ).not.toBeInTheDocument();
    });
  });

  it("should not close modal when clicking inside modal card", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, data: mockShelters },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: mockAllOrders },
      });

    render(<Shelters />);

    await waitFor(() => {
      expect(screen.getByText("Hope Shelter")).toBeInTheDocument();
    });

    const redistributeButtons = screen.getAllByText("Redistribute Orders");
    fireEvent.click(redistributeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Redistribute Orders → Hope Shelter/)).toBeInTheDocument();
    });

    const modalCard = document.querySelector(".modal-card");
    fireEvent.click(modalCard);

    // Modal should still be visible
    expect(screen.getByText(/Redistribute Orders → Hope Shelter/)).toBeInTheDocument();
  });

  
});