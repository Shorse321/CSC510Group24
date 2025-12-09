## Changelog

All notable changes to this project will be documented in this file.

---

## 1.0 – 2025-11-05
### Added
- Initial public documentation for the project:
  - `README.md` describing the single-restaurant model, cancellation-based redistribution, and 3D menu visualization.
  - `API.md` specifying backend endpoints for users, food, cart, orders, shelters, and reroute history.
  - `CONTRIBUTING.md` with contribution workflow and coding guidelines.
  - `CODE_OF_CONDUCT.md` adapted from the Contributor Covenant.
  - `LICENSE` using the MIT license with NCSU Team G25 attribution.

- Core feature set in the backend:
  - User registration and login with JWT-based authentication.
  - Menu management with optional 3D model uploads for dishes.
  - Cart operations (add, remove, get) bound to authenticated users.
  - Order placement with Stripe-based flow and cash-on-delivery.
  - Order status finite-state machine, including  
    `Food Processing → Out for delivery → Delivered → Redistribute → Cancelled`.
  - Customer-driven cancellation that moves orders into a `Redistribute` queue.
  - Customer-to-customer claiming of redistributable orders.
  - Restaurant-driven assignment of redistributed or cancelled orders to shelters.
  - Reroute (donation) history via a dedicated `reroutes` collection.

- Frontend and admin applications:
  - Customer-facing React + Vite frontend for ordering, claiming, and 3D viewing.
  - Admin React + Vite dashboard for menu management, order monitoring, and shelter assignment.

---

## [2.1] – 2025-11-23
### Added
- **Proximity-based notification system**
  - Computes nearest eligible customers based on geo-coordinates.
  - Filters out recent cancellers to avoid notification spam.
  - Sends real-time WebSocket alerts for redistributed orders.
  - Server-side proximity scoring for fairness.

- **Map visualization module**
  - Interactive map view (Leaflet + OpenStreetMap).
  - Real-time plotting of order locations and shelters.
  - Color-coded markers for status (active, cancelled, donated).
  - Map embedded in admin dashboard + customer order tracker.

---

## [2.2] – 2025-12-09
### Added
- **Bulk booking (group order) support**
  - Restaurants selling food in bulk quantities
  - Users bulk order booking

- **User preference engine**
  - Tracks cuisine/category popularity at user level.
  - “Recommended for You” ranking on menu.
  - Diet-aware suggestions (vegan, gluten-free, allergens).
  - Personalized redistributable-order suggestions.

---

## [2.3] – 2025-12-10
### Added
- **Full ByteBite 2.3 integration release**
  - Combined proximity notifications, maps, bulk booking and personalization into the stable pipeline.
  - Final UI polish for both customer & admin dashboards.

---

[2.1]: https://github.com/Shorse321/CSC510Group24/releases/tag/v2.1
[2.2]: https://github.com/Shorse321/CSC510Group24/releases/tag/v2.2
[2.3]: https://github.com/Shorse321/CSC510Group24/releases/tag/v2.3
