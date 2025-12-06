import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "../Navbar/Navbar";

// Mock assets
vi.mock("../../assets/assets", () => ({
  assets: {
    logo: "logo.png",
    profile_image: "profile.png",
  },
}));

describe("Navbar Component", () => {
  it("renders navbar container", () => {
    render(<Navbar />);
    const navbar = document.querySelector(".navbar");
    expect(navbar).toBeInTheDocument();
  });

  it("renders logo image", () => {
    render(<Navbar />);
    const logo = document.querySelector(".logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "logo.png");
  });

  it("renders profile image", () => {
    render(<Navbar />);
    const profile = document.querySelector(".profile");
    expect(profile).toBeInTheDocument();
    expect(profile).toHaveAttribute("src", "profile.png");
  });

  it("has navbar-left and navbar-right sections", () => {
    render(<Navbar />);
    expect(document.querySelector(".navbar-left")).toBeInTheDocument();
    expect(document.querySelector(".navbar-right")).toBeInTheDocument();
  });

  it("scrolls to footer when About Us or Contact Us clicked", () => {
    const scrollIntoViewMock = vi.fn();
    const footer = document.createElement("div");
    footer.id = "footer";
    footer.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(footer);

    render(<Navbar />);
    
    const aboutUs = screen.getByText("About Us");
    fireEvent.click(aboutUs);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });

    const contactUs = screen.getByText("Contact Us");
    fireEvent.click(contactUs);
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);

    document.body.removeChild(footer);
  });
});