# Getting Started with ByteBite

This document provides detailed instructions for setting up and running the **ByteBite** system on a local or development environment.  
ByteBite is a food-ordering and redistribution platform built by **NCSU Team G25** and improved by **NCSU Team G25**, designed for a **restaurants** that can redirect cancelled orders to partner shelters, thereby reducing food waste and supporting community well-being.

---

## Prerequisites

Before installation, ensure that the following components are available on your system:

- **Node.js** (version 18 or later)
- **npm** or **yarn**
- **MongoDB instance** (local or hosted)
- **Stripe test keys** (for online payment integration)
- **A modern web browser**

---

## Backend Setup

### 1. Change Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Database and Environment Variables

- The file `config/db.js` contains the Mongoose connection logic.  
  Update the MongoDB connection string to point to your own instance.

- Create a `.env` file in the `backend/` directory containing the following minimum configuration:

  ```env
  JWT_SECRET=replace-with-a-long-random-secret
  STRIPE_SECRET_KEY=replace-with-stripe-secret
  ```

### 4. Start the Backend Server

```bash
npm run server
```

By default, the server listens on `http://localhost:4000` and exposes the following API routes:

| Module            | Base Path                                   |
| ----------------- | ------------------------------------------- |
| User              | `http://localhost:4000/api/user`            |
| Food              | `http://localhost:4000/api/food`            |
| Cart              | `http://localhost:4000/api/cart`            |
| Order             | `http://localhost:4000/api/order`           |
| Shelters          | `http://localhost:4000/api/shelters`        |
| Reroutes          | `http://localhost:4000/api/reroutes`        |
| Recommendations   | `http://localhost:4000/api/recommendations` |

### Rule-Based Recommendation API

The new rule engine surfaces curated meals for every authenticated user by combining:

- Historical purchases (top categories, frequently re-ordered dishes)
- Stored preference tags (strings saved via `/api/user/preferences`)
- Item attributes (category, price, surplus discounts)

Request personalized meals:

```bash
curl -X GET "http://localhost:4000/api/recommendations/meals?limit=5" \
  -H "token: <JWT from /api/user/login>"
```

Query parameters:

- `limit` (optional): cap the number of meals (default `10`, max `50`)
- `debug` (optional, `true/false`): include the computed user profile & rules applied (useful for QA)

Sample response:

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "foodId": "665fa4...",
        "name": "Greek Salad",
        "category": "Salad",
        "price": 12,
        "isSurplus": false,
        "score": 64.5,
        "reasons": [
          "Within preferred price range",
          "Popular category: Salad",
          "Matches preference tags (salad)"
        ],
        "appliedRules": [
          "price_alignment",
          "category_affinity",
          "tag_match"
        ]
      }
    ]
  }
}
```

When `debug=true`, the `data.profile` payload shows the exact tags, price bands, and rules used so that the behavior remains transparent during testing.

---

## Frontend Setup (Customer Application)

### 1. Change Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The default Vite development server runs at:

```
http://localhost:5173
```

This application enables customers to browse the menu, place orders, view order history, claim redistributed orders, and view 3D visualizations of selected dishes.

---

## Admin Setup (Restaurant Dashboard)

### 1. Change Directory

```bash
cd admin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The admin dashboard typically runs at:

```
http://localhost:5174
```

This interface allows restaurant staff to:

- Manage menu items and categories.
- Track customer orders in real time.
- Redistribute or assign cancelled orders to partner shelters.

---

## Data Model Overview (High-Level)

| Model        | Description                                                                                                                                                                                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **user**     | Stores user credentials, contact details, address (latitude and longitudes) and cart data. Authentication is handled through JWT.                                                                                                                                                                                                    |
| **food**     | Represents menu items, including price, category, images, and optional 3D model references.                                                                                                                                                                                                        |
| **order**    | Tracks customer orders including items, total amount, address, status, and payment flag. Orders can transition through a finite-state model (`Food Processing`, `Out for Delivery`, `Delivered`, `Redistribute`, `Cancelled`,`Claimed`). They may also be reassigned to new customers or shelters. |
| **shelter**  | Represents registered partner shelters, including contact and address details and an `active` flag.                                                                                                                                                                                                |
| **reroutes** | Maintains a record of redistributed or donated orders, including shelter details, order contents and timestamps.                                                                                                                                                                                  |

---

## Next Steps

After setup, you can:

- Access the customer interface at `http://localhost:5173`
- Access the admin dashboard at `http://localhost:5174`
- Use MongoDB Compass or `mongosh` to inspect the database
- Begin experimenting with order placement, cancellation, and redistribution flows

---

**Maintainers:**  
_Developed and maintained by NCSU Team G24, 25 (2025)._  
Licensed under the [MIT License](LICENSE).
