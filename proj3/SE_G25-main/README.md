# ByteBite

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17547308.svg)](https://doi.org/10.5281/zenodo.17547336)

## Project Health & Status

### Quality Assurance
[![codecov](https://codecov.io/gh/Shorse321/CSC510Group24/branch/main/graph/badge.svg?token=ENTA0IQ3HM)](https://codecov.io/gh/Shorse321/CSC510Group24)
**Config:** [Jest Config (Backend)](backend/package.json) · [Vite Config (Frontend)](frontend/vite.config.js) · [Vite Config (Admin)](admin/vite.config.js)

### CI/CD Build Status
[![Backend CI](https://github.com/Shorse321/CSC510Group24/actions/workflows/backend.yml/badge.svg)](https://github.com/Shorse321/CSC510Group24/actions/workflows/backend.yml)
[![Frontend CI](https://github.com/Shorse321/CSC510Group24/actions/workflows/frontend.yml/badge.svg)](https://github.com/Shorse321/CSC510Group24/actions/workflows/frontend.yml)
[![Admin Panel CI](https://github.com/Shorse321/CSC510Group24/actions/workflows/admin.yml/badge.svg)](https://github.com/Shorse321/CSC510Group24/actions/workflows/admin.yml)

### Repository Stats
[![License](https://img.shields.io/badge/license-Educational-blue.svg)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/Shorse321/CSC510Group24)](https://github.com/Shorse321/CSC510Group24/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/Shorse321/CSC510Group24)](https://github.com/Shorse321/CSC510Group24/commits/main)
[![Issues](https://img.shields.io/github/issues/Shorse321/CSC510Group24)](https://github.com/Shorse321/CSC510Group24/issues)

### 🎯 Synatax & Style Checker (ESLint)
[![ESLint Syntax Checker](https://github.com/Shorse321/CSC510Group24/actions/workflows/lint.yml/badge.svg)](https://github.com/Shorse321/CSC510Group24/actions/workflows/lint.yml)
**Workflow:** [.github/workflows/lint.yml](../../../../.github/workflows/lint.yml)  
**Config:** [Backend](backend/.eslintrc.cjs) · [Frontend](frontend/.eslintrc.cjs) · [Admin](admin/.eslintrc.cjs)

[![ESLint Style Checker](https://github.com/Shorse321/CSC510Group24/actions/workflows/lint.yml/badge.svg)](https://github.com/Shorse321/CSC510Group24/actions/workflows/lint.yml)
**Workflow:** [.github/workflows/lint.yml](../../../../.github/workflows/lint.yml)  
**Config:** [Backend](backend/.eslintrc.cjs) · [Frontend](frontend/.eslintrc.cjs) · [Admin](admin/.eslintrc.cjs)

[![Code Formatter (Prettier)](https://github.com/Shorse321/CSC510Group24/actions/workflows/format.yml/badge.svg)](https://github.com/Shorse321/CSC510Group24/actions/workflows/format.yml)

**Workflow:** [.github/workflows/format.yml](../../../../.github/workflows/format.yml)  
**Config:** [.prettierrc.json](scripts/.prettierrc.json) · [.prettierignore](scripts/.prettierignore)
---

**ByteBite** is a single-restaurant food-ordering and food-redistribution system built by **NCSU Team G24**. The platform bridges the gap between commercial food service and community support by integrating standard ordering with intelligent surplus redistribution.

### Built With
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

---

**Demo video available on Google Drive:** [Click here to access](https://drive.google.com/drive/folders/1cu_q0Fzv2eirk6KWtg8ypfO_mJUwBUOG)

The project has four main capabilities:
1. **Standard Ordering:** Customers place orders, track status, and pay online or via cash-on-delivery.
2. **Redistribution Logic:** Cancelled or surplus orders are redirected to a public "claim" queue for other users or assigned to partner shelters.
3. **Bulk Surplus Sales:** Restaurants can list bulk quantities of surplus items at special rates to minimize end-of-day waste.
4. **Interactive Visualization:** Customers view menu items via a 3D model carousel for a richer user experience.

The goal is to reduce food waste while maintaining a standard online ordering experience.

---

## System Overview

The system consists of three applications:

- `backend/`  
  Node.js + Express + MongoDB API exposing authentication, menu, cart, order, shelter, and reroute (donation history) endpoints.

- `frontend/`  
  React + Vite customer-facing web application for browsing the menu, placing orders, claiming redistributed orders, and viewing 3D models of dishes (via `three`, `@react-three/fiber`, and `@react-three/drei`).

- `admin/`  
  React + Vite restaurant admin dashboard for managing menu items, monitoring orders, updating statuses, and assigning cancelled orders to partner shelters.

The backend exposes REST endpoints under `/api/*` and uses JSON Web Tokens (JWT) for authenticated operations.

---

## Core Functionalities

### 1. Customer Ordering

- Customers register and log in.
- Customers browse the menu, add items to their cart, and place orders.
- Orders are stored in MongoDB with a finite-state status model:
  - `Food Processing`
  - `Out for delivery`
  - `Delivered`
  - `Redistribute`
  - `Cancelled`
  - `Claimed`
- Payment can be completed either by:
  - Stripe-based flow (`/api/order/place` + `/api/order/verify`), or
  - Cash-on-delivery (`/api/order/placecod`).

### 2. Cancellation and Redistribution Queue

When a customer cancels an order:

- The backend validates that the cancelling user is either the original owner or (if already claimed) the current owner.
- If the status allows cancellation (for example, `Food Processing` or `Out for delivery`), the status is set to `Redistribute`.
- A queue notification is emitted via Socket.IO so that interested clients can display the cancelled order to other customers.

### 3. Claiming a Cancelled Order (Customer-to-Customer)

- Redistributable orders (status `Redistribute`) can be claimed by other authenticated customers via the `/api/order/claim` endpoint.
- When a claim succeeds:
  - Ownership of the order is transferred to the claimant.
  - The order status is set back to `Food Processing`.
  - The order now appears in the claimant’s order history.
- Shelters do not claim orders directly from the queue. Only customers claim orders. Restaurant staff remain responsible for reassigning orders to shelters.

### 4. Restaurant-to-Shelter Donation

The restaurant can donate cancelled or redistributable orders to shelters:

- Partner shelters are stored in the `shelter` collection and may be seeded via `/api/shelters/seed`.
- Active shelters can be listed via `/api/shelters/list`.
- Restaurant staff use the admin dashboard to assign an order to a shelter, which calls `/api/order/assign-shelter` on the backend.
- `assign-shelter`:
  - Validates the order and shelter.
  - Ensures the order is in a suitable state (`Redistribute` or `Cancelled`).
  - Attaches shelter metadata to the order.
  - Records a donation entry in the `reroutes` collection.
- Donation history is available via `/api/reroutes`, which supports pagination and is designed to back the shelter-history view in the admin interface.

Shelters are passive recipients in this model: they do not directly interact with the API to “claim” food. The restaurant manages all redirection.

### 5. 3D Menu Visualization

The customer-facing frontend supports rendering of 3D models associated with menu items:

- When the restaurant uploads a dish, it may attach:
  - A standard 2D image, and
  - An optional 3D model asset.
- The frontend uses `three`, `@react-three/fiber`, and `@react-three/drei` to render a 3D carousel of dishes.
- This allows customers to inspect certain items in a more realistic and interactive way.


### 6. Bulk Surplus Sales (New!)
- **Goal:** Rapidly clear large quantities of specific inventory (e.g., end-of-shift bakery items).
- **Admin Flow:** Restaurant staff create "Bulk Items" specifying quantity, discounted price, and availability windows.
- **User Flow:** These items appear in a dedicated "Surplus/Bulk" section of the menu, allowing users to purchase larger quantities at a better value, directly reducing food waste.

### 7. User Notifcation Preferances (New!)
- **Goal:** Users receive only notifactions of redistributed order that they want (e.g., user wants only to be notified of orders greater than $50).
- **User Flow:** User selects their profile icon in the top right. User selects preferences. User is prompted with the many preferences option including: how far away a notification can come from, enable/disable notifications, price range of a notification, and selecting which items to be notified of.
---

## Updates & Announcements

We post short updates whenever we ship features or milestones.

- Full changelog: see **[docs/updates.md](docs/updates.md)**
- Latest highlights:
   — Claim Order feature: cancelled → Redistribute → Claimed, with real-time pop-ups.
## Project Stats

- **Partner Shelters/NGOs:** 10 (registered for end-of-day surplus donations)
- **Redistributed Meals:** 15+ (successfully reassigned through the Claim Order module)
- **Active Contributors:** 4(core developers from Team 25 – SE Project Group)
- **Intelligent Modules:** 4 (Cancel-to-Redistribute, Shelter Pipeline, and Real-time Claim Notifications, 3D Visualization)

> *ByteBite transforms canceled and surplus orders into redistributable meals — connecting restaurants, users, and shelters in real time to reduce food waste and support the community.*
 
## Partners & Collaborators

| Partner / Role | Contribution |
|----------------|---------------|
| **Team 25 – ByteBite (NCSU SE Project Fall 2025)** | Core development team responsible for full-stack architecture, backend API, and workflow flow |
| **NCSU Department of Computer Science** | Provided project framework, evaluation, and academic guidance |
| **OpenAI (ChatGPT) & Anthropic (Claude)** | Assisted in idea exploration, UI refinement, and code documentation |

---
## Repository Structure

```text
backend/
  config/db.js
  controllers/
    cartController.js
    foodController.js
    orderController.js
    rerouteController.js
    shelterController.js
    userController.js
  middleware/
    auth.js
  models/
    foodModel.js
    orderModel.js
    rerouteModel.js
    shelterModel.js
    userModel.js
  routes/
    cartRoute.js
    foodRoute.js
    orderRoute.js
    rerouteRoute.js
    shelterRoute.js
    userRoute.js
  tests/
  server.js
  package.json

frontend/
  src/
    components/
    assets/
    pages/
  package.json

admin/
  src/
    components/
    pages/
  package.json




