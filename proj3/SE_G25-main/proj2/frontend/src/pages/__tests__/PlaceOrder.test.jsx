import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import PlaceOrder from "../PlaceOrder/PlaceOrder";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

vi.mock("axios");
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockStoreContext = {
  getTotalCartAmount: vi.fn(() => 25.99),
  token: "mock-token",
  food_list: [
    { 
      _id: "food1", 
      name: "Pizza", 
      price: 10.99,
      image: "pizza.jpg",
      model3D: "pizza.glb",
      category: "Main Course"
    },
    { 
      _id: "food2", 
      name: "Burger", 
      price: 15.0,
      image: "burger.jpg",
      model3D: "burger.glb",
      category: "Fast Food"
    },
  ],
  cartItems: { food1: 2, food2: 1 },
  url: "http://localhost:4000",
  setCartItems: vi.fn(),
  currency: "$",
  deliveryCharge: 5,
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

describe("PlaceOrder Component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    delete window.location;
    window.location = { replace: vi.fn() };
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ==================== RENDERING TESTS ====================

  it("should render place order form with all required fields", () => {
    renderWithProviders(<PlaceOrder />);
    
    expect(screen.getByText("Delivery Information")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Street")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("City")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("State")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Zip code")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Country")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Phone")).toBeInTheDocument();
  });

  it("should render cart totals section", () => {
    renderWithProviders(<PlaceOrder />);
    
    expect(screen.getByText("Cart Totals")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Delivery Fee")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("should render payment method section", () => {
    renderWithProviders(<PlaceOrder />);
    
    expect(screen.getByText("Payment Method")).toBeInTheDocument();
    expect(screen.getByText("COD ( Cash on delivery )")).toBeInTheDocument();
    expect(screen.getByText("Stripe ( Credit / Debit )")).toBeInTheDocument();
  });

  it("should display correct cart total amounts", () => {
    renderWithProviders(<PlaceOrder />);
    
    // Subtotal: $25.99
    const subtotalElements = screen.getAllByText("$25.99");
    expect(subtotalElements.length).toBeGreaterThan(0);
    
    // Delivery Fee: $5
    expect(screen.getByText("$5")).toBeInTheDocument();
    
    // Total: $30.99
    expect(screen.getByText("$30.99")).toBeInTheDocument();
  });

  it("should show zero delivery fee when cart is empty", () => {
    const emptyCartContext = {
      ...mockStoreContext,
      getTotalCartAmount: vi.fn(() => 0),
    };
    
    renderWithProviders(<PlaceOrder />, emptyCartContext);
    
    const zeroElements = screen.getAllByText("$0");
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  // ==================== FORM INPUT TESTS ====================

  it("should handle first name input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const firstNameInput = screen.getByPlaceholderText("First name");
    await user.type(firstNameInput, "John");
    
    expect(firstNameInput).toHaveValue("John");
  });

  it("should handle last name input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const lastNameInput = screen.getByPlaceholderText("Last name");
    await user.type(lastNameInput, "Doe");
    
    expect(lastNameInput).toHaveValue("Doe");
  });

  it("should handle email input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const emailInput = screen.getByPlaceholderText("Email address");
    await user.type(emailInput, "john@example.com");
    
    expect(emailInput).toHaveValue("john@example.com");
  });

  it("should handle street input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const streetInput = screen.getByPlaceholderText("Street");
    await user.type(streetInput, "123 Main St");
    
    expect(streetInput).toHaveValue("123 Main St");
  });

  it("should handle city input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const cityInput = screen.getByPlaceholderText("City");
    await user.type(cityInput, "Raleigh");
    
    expect(cityInput).toHaveValue("Raleigh");
  });

  it("should handle state input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const stateInput = screen.getByPlaceholderText("State");
    await user.type(stateInput, "NC");
    
    expect(stateInput).toHaveValue("NC");
  });

  it("should handle zipcode input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const zipcodeInput = screen.getByPlaceholderText("Zip code");
    await user.type(zipcodeInput, "27601");
    
    expect(zipcodeInput).toHaveValue("27601");
  });

  it("should handle country input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const countryInput = screen.getByPlaceholderText("Country");
    await user.type(countryInput, "USA");
    
    expect(countryInput).toHaveValue("USA");
  });

  it("should handle phone input change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const phoneInput = screen.getByPlaceholderText("Phone");
    await user.type(phoneInput, "123-456-7890");
    
    expect(phoneInput).toHaveValue("123-456-7890");
  });

  it("should handle all form fields together", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    expect(screen.getByPlaceholderText("First name")).toHaveValue("John");
    expect(screen.getByPlaceholderText("Last name")).toHaveValue("Doe");
    expect(screen.getByPlaceholderText("Email address")).toHaveValue("john@example.com");
    expect(screen.getByPlaceholderText("Street")).toHaveValue("123 Main St");
    expect(screen.getByPlaceholderText("City")).toHaveValue("Raleigh");
    expect(screen.getByPlaceholderText("State")).toHaveValue("NC");
    expect(screen.getByPlaceholderText("Zip code")).toHaveValue("27601");
    expect(screen.getByPlaceholderText("Country")).toHaveValue("USA");
    expect(screen.getByPlaceholderText("Phone")).toHaveValue("123-456-7890");
  });

  // ==================== PAYMENT METHOD TESTS ====================

  it("should default to COD payment method", () => {
    renderWithProviders(<PlaceOrder />);
    
    const submitButton = screen.getByRole("button", { name: /place order/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent("Place Order");
  });

  it("should switch to Stripe payment method", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const stripeOption = screen.getByText("Stripe ( Credit / Debit )");
    await user.click(stripeOption);

    const submitButton = screen.getByRole("button", { name: /proceed to payment/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent("Proceed To Payment");
  });

  it("should switch back to COD from Stripe", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    // Switch to Stripe
    const stripeOption = screen.getByText("Stripe ( Credit / Debit )");
    await user.click(stripeOption);
    
    expect(screen.getByRole("button", { name: /proceed to payment/i })).toBeInTheDocument();

    // Switch back to COD
    const codOption = screen.getByText("COD ( Cash on delivery )");
    await user.click(codOption);

    expect(screen.getByRole("button", { name: /place order/i })).toBeInTheDocument();
  });

  // ==================== COD ORDER PLACEMENT TESTS ====================

  it("should submit COD order successfully", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, message: "Order placed successfully" },
    });

    renderWithProviders(<PlaceOrder />);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:4000/api/order/placecod",
        expect.objectContaining({
          address: expect.objectContaining({
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            street: "123 Main St",
            city: "Raleigh",
            state: "NC",
            zipcode: "27601",
            country: "USA",
            phone: "123-456-7890",
          }),
          items: expect.any(Array),
          amount: 30.99,
        }),
        { headers: { token: "mock-token" } }
      );
    });
  });

  it("should remove image and model3D from order items", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, message: "Order placed successfully" },
    });

    renderWithProviders(<PlaceOrder />);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      const callArgs = axios.post.mock.calls[0];
      const orderData = callArgs[1];
      
      // Check that items don't have image or model3D
      orderData.items.forEach(item => {
        expect(item).not.toHaveProperty('image');
        expect(item).not.toHaveProperty('model3D');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('price');
      });
    });
  });

  it("should redirect to myorders after successful COD order", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, message: "Order placed successfully" },
    });

    renderWithProviders(<PlaceOrder />);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith("/myorders");
      expect(toast.success).toHaveBeenCalledWith("Order placed successfully");
      expect(mockStoreContext.setCartItems).toHaveBeenCalledWith({});
    });
  });

  it("should show error toast when COD order fails", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: false, message: "Order failed" },
    });

    renderWithProviders(<PlaceOrder />);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
    });
  });

  // ==================== STRIPE ORDER PLACEMENT TESTS ====================

  it("should submit Stripe order successfully", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, session_url: "https://stripe.com/checkout/session123" },
    });

    renderWithProviders(<PlaceOrder />);

    // Switch to Stripe payment
    const stripeOption = screen.getByText("Stripe ( Credit / Debit )");
    await user.click(stripeOption);

    await user.type(screen.getByPlaceholderText("First name"), "Jane");
    await user.type(screen.getByPlaceholderText("Last name"), "Smith");
    await user.type(screen.getByPlaceholderText("Email address"), "jane@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "456 Oak Ave");
    await user.type(screen.getByPlaceholderText("City"), "Durham");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27701");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "987-654-3210");

    const submitButton = screen.getByRole("button", { name: /proceed to payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:4000/api/order/place",
        expect.objectContaining({
          address: expect.objectContaining({
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
          }),
          items: expect.any(Array),
          amount: 30.99,
        }),
        { headers: { token: "mock-token" } }
      );
    });
  });

  it("should redirect to Stripe checkout after successful Stripe order", async () => {
    const user = userEvent.setup();
    const sessionUrl = "https://stripe.com/checkout/session123";
    
    axios.post.mockResolvedValue({
      data: { success: true, session_url: sessionUrl },
    });

    renderWithProviders(<PlaceOrder />);

    const stripeOption = screen.getByText("Stripe ( Credit / Debit )");
    await user.click(stripeOption);

    await user.type(screen.getByPlaceholderText("First name"), "Jane");
    await user.type(screen.getByPlaceholderText("Last name"), "Smith");
    await user.type(screen.getByPlaceholderText("Email address"), "jane@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "456 Oak Ave");
    await user.type(screen.getByPlaceholderText("City"), "Durham");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27701");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "987-654-3210");

    const submitButton = screen.getByRole("button", { name: /proceed to payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith(sessionUrl);
    });
  });

  it("should show error toast when Stripe order fails", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: false },
    });

    renderWithProviders(<PlaceOrder />);

    const stripeOption = screen.getByText("Stripe ( Credit / Debit )");
    await user.click(stripeOption);

    await user.type(screen.getByPlaceholderText("First name"), "Jane");
    await user.type(screen.getByPlaceholderText("Last name"), "Smith");
    await user.type(screen.getByPlaceholderText("Email address"), "jane@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "456 Oak Ave");
    await user.type(screen.getByPlaceholderText("City"), "Durham");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27701");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "987-654-3210");

    const submitButton = screen.getByRole("button", { name: /proceed to payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
    });
  });

  // ==================== AUTHENTICATION & CART VALIDATION TESTS ====================

  it("should redirect to cart if user is not authenticated", () => {
    const noTokenContext = {
      ...mockStoreContext,
      token: null,
    };

    renderWithProviders(<PlaceOrder />, noTokenContext);

    expect(toast.error).toHaveBeenCalledWith("to place an order sign in first");
    expect(mockNavigate).toHaveBeenCalledWith("/cart");
  });

  it("should redirect to cart if cart is empty", () => {
    const emptyCartContext = {
      ...mockStoreContext,
      getTotalCartAmount: vi.fn(() => 0),
    };

    renderWithProviders(<PlaceOrder />, emptyCartContext);

    expect(mockNavigate).toHaveBeenCalledWith("/cart");
  });

  it("should not redirect if token exists and cart has items", () => {
    renderWithProviders(<PlaceOrder />);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  // ==================== ORDER DATA CONSTRUCTION TESTS ====================

  it("should correctly build order items from cart", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, message: "Order placed successfully" },
    });

    renderWithProviders(<PlaceOrder />);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      const callArgs = axios.post.mock.calls[0];
      const orderData = callArgs[1];
      
      expect(orderData.items).toHaveLength(2);
      expect(orderData.items[0]).toMatchObject({
        _id: "food1",
        name: "Pizza",
        price: 10.99,
        quantity: 2,
      });
      expect(orderData.items[1]).toMatchObject({
        _id: "food2",
        name: "Burger",
        price: 15.0,
        quantity: 1,
      });
    });
  });

  it("should only include items that are in the cart", async () => {
    const user = userEvent.setup();
    const partialCartContext = {
      ...mockStoreContext,
      cartItems: { food1: 3 }, // Only food1 in cart
    };
    
    axios.post.mockResolvedValue({
      data: { success: true, message: "Order placed successfully" },
    });

    renderWithProviders(<PlaceOrder />, partialCartContext);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      const callArgs = axios.post.mock.calls[0];
      const orderData = callArgs[1];
      
      expect(orderData.items).toHaveLength(1);
      expect(orderData.items[0]._id).toBe("food1");
      expect(orderData.items[0].quantity).toBe(3);
    });
  });

  it("should calculate correct total amount including delivery charge", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValue({
      data: { success: true, message: "Order placed successfully" },
    });

    renderWithProviders(<PlaceOrder />);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      const callArgs = axios.post.mock.calls[0];
      const orderData = callArgs[1];
      
      // 25.99 (cart total) + 5 (delivery charge) = 30.99
      expect(orderData.amount).toBe(30.99);
    });
  });

  // ==================== EDGE CASES ====================

  it("should handle network error during order submission", async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue(new Error("Network error"));

    renderWithProviders(<PlaceOrder />);

    await user.type(screen.getByPlaceholderText("First name"), "John");
    await user.type(screen.getByPlaceholderText("Last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email address"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Street"), "123 Main St");
    await user.type(screen.getByPlaceholderText("City"), "Raleigh");
    await user.type(screen.getByPlaceholderText("State"), "NC");
    await user.type(screen.getByPlaceholderText("Zip code"), "27601");
    await user.type(screen.getByPlaceholderText("Country"), "USA");
    await user.type(screen.getByPlaceholderText("Phone"), "123-456-7890");

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it("should prevent form submission with empty required fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlaceOrder />);

    const submitButton = screen.getByRole("button", { name: /place order/i });
    await user.click(submitButton);

    // Form should not submit - axios should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should display correct currency symbol", () => {
    renderWithProviders(<PlaceOrder />);

    const currencySymbols = screen.getAllByText(/\$/);
    expect(currencySymbols.length).toBeGreaterThan(0);
  });

  it("should use custom currency when provided", () => {
    const customCurrencyContext = {
      ...mockStoreContext,
      currency: "€",
    };

    renderWithProviders(<PlaceOrder />, customCurrencyContext);

    expect(screen.getAllByText(/€/).length).toBeGreaterThan(0);
  });
});