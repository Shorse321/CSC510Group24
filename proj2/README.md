# 🍔 StackShack - Build Your Own Burger! (Version 1.2)

<div align="center">

[![Tests](https://github.com/Shorse321/CSC510Group24/actions/workflows/tests.yml/badge.svg)](https://github.com/Shorse321/CSC510Group24/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/Shorse321/CSC510Group24/graph/badge.svg?token=M71DB8ZDSC)](https://codecov.io/gh/Shorse321/CSC510Group24)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-3.0.0-lightgrey.svg)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/mysql-8.0-blue.svg)](https://www.mysql.com/)

[![License](https://img.shields.io/badge/license-Educational-blue.svg)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/Shorse321/CSC510Group24)](https://github.com/Shorse321/CSC510Group24/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/Shorse321/CSC510Group24)](https://github.com/Shorse321/CSC510Group24/commits/main)
[![Issues](https://img.shields.io/github/issues/Shorse321/CSC510Group24)](https://github.com/Shorse321/CSC510Group24/issues)

[![DOI](https://zenodo.org/badge/1044477954.svg)](https://doi.org/10.5281/zenodo.17509156)
[![Run Tests and Linting](https://github.com/shorse321/csc510group24/actions/workflows/tests.yml/badge.svg?branch=development&event=push)](https://github.com/shorse321/csc510group24/actions/workflows/tests.yml)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Linter: Ruff](https://img.shields.io/badge/Linter-Ruff-blue)](https://github.com/astral-sh/ruff)

**Group 24** • CSC 510 - Software Engineering

*Build your perfect custom burger with fresh and healthy ingredients!*

[Features](#stackshack-who-are-we) • [Installation](#installation) • [Usage](#usage) • [Testing](#running-the-test-suite) • [Team](#team)

</div>

---
## StackShack! Who are we?
Feeling overwhelmed by campus dining options?  StackShack makes it fun, fast and easy. Customize every layer of your burger—from buns to sauces, toppings to patties — so every bite is exactly how you want it.  Eat Bold. Eat Fresh.

*Free and open source for educational use

## Why You’ll Love Us: 

- Build a burger as unique as you are.
- Balance or treat yourself — it’s your choice.
- No waiting, no confusion — just stack and go.
- Feeling adventurous? Get random burgers tailored.
- Watch your order come to life from kitchen to tray.

Are you a developer? Our FLASK + MySQL based application is easy to use, easy to maintain, lightweight, scalable, modular and clean!

### Features
#### User Management

Unified login portal providing role-based access and functionality for customers, staff and admins.

#### Order Purchase

Interactive page that lets users custom-build their burger from scratch; With real-time visuals and dynamic pricing, customers can choose from a variety of buns, patties, sauces and toppings.

#### Order Management

Staff manages orders in real-time to prepare and fulfill them efficiently; Customers can track orders’ progress, ensuring transparency and reducing waiting time at the counter.

#### Menu Management

Admins have full control over menu items and daily ingredient availability; Mark healthy options and disable out-of-stock ingredients to promote balanced, nutritious meals.

### Who can use StackShack?

What's stopping you from building your custom burgers? Wa have a fun, intuitive interface to design your healthy burger! University students, faculty, parents, guests, restaurant staff and admins, come visit us! 

### For Customers
- Browse available menu items
- View nutritional information (calories, protein)
- Custom burger builder

### For Admins
- Full menu management
- User management
- Manage staff/admin accounts
  
### For Staff
- Manage menu ingredients availabiliy and healthy choices
- Manage order status (tracking)

---

## Tech Stack

**Backend:**
- Python 3.8+
- Flask 3.0.0
- Flask-SQLAlchemy (ORM)
- Flask-Login (Authentication)
- MySQL Database

**Frontend:**
- HTML5
- CSS3
- Jinja2 Templates

**Database:**
- MySQL 8.0+

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
- **MySQL 8.0 or higher** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download Git](https://git-scm.com/downloads)

---
## Project Structure

```bash
stackshack/
├── controllers/           # Business logic
│   ├── auth_controller.py
│   ├── menu_controller.py
│   └── order_controller.py
├── database/              # Database configuration
│   └── db.py
├── models/                # Database models
│   ├── user.py
│   ├── menu_item.py
│   └── order.py
├── routes/                # URL routing
│   ├── auth_routes.py
│   ├── menu_routes.py
│   └── order_routes.py
├── templates/             # HTML templates
│   ├── menu/
│   │   ├── items.html
│   │   ├── create_item.html
│   │   ├── edit_item.html
│   │   └── browse_ingredients.html
│   ├── orders/
│   │   ├── create.html
│   │   └── history.html
│   ├── base.html
│   ├── home.html
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   ├── menu.html
│   ├── admin_create.html
│   └── admin_manage.html
├── tests/
│   ├── menuManagementTests/
│   │   ├── conftest.py
│   │   ├── test_menu_model.py
│   │   ├── test_menu_controller.py
│   │   └── test_menu_routes.py
│   ├── LoginManagementTests/
│   │   ├── conftest.py
│   │   └── test_auth.py
│   └── purchaseManagementTests/
│       ├── conftest.py
│       ├── test_create.py
│       ├── test_models.py
│       ├── test_controllers.py
│       └── test_routes.py
├── venv/                  # Virtual environment (not in Git)
├── .env                   # Environment variables (not in Git)
├── .gitignore             # Git ignore rules
├── app.py                 # Main application file
├── config.py              # Configuration settings
├── test_conn.py
├── create_admin.py
├── seed_menu.py
├── requirements.txt       # Python dependencies
└── README.md              # Documentation
```
---

## Flask Project Structure (Modularity)
- **Blueprints** separate app modules (`auth_bp`, `menu_bp`, `order_bp`) for clean routing.
- **Controllers** handle business logic separately from routes.
- **Templates** (HTML files) are organized into folders per module (`auth/`, `menu/`, `orders/`).
- **Tests** follow modular test folder structure with one subfolder per feature (`LoginManagementTests`, `menuManagementTests`, `purchaseManagementTests`).

![Architecture](stackshack/static/images/modular_arch.png)

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Shorse321/CSC510Group24.git
cd CSC510Group24/proj2/stackshack
```

### 2. Set Up Virtual Environment

**Windows (Git Bash):**
```bash
python -m venv venv
source venv/Scripts/activate
```

**Windows (PowerShell):**
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` appear in your terminal prompt.

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Up MySQL Database

**Open MySQL Workbench or command line and run:**
```sql
CREATE DATABASE stackshack;
USE stackshack;
```

The tables will be created automatically when you first run the app.

### 5. Configure Environment Variables

Create a `.env` file in the project root:
```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stackshack
```

**Important:** Replace `your_mysql_password` with your actual MySQL password!

### 6. Initialize the Database (if the tables haven't been automatically created)
```bash
python create_tables.py
```

### 7. Create Admin User
```bash
python create_admin.py
```

This creates an admin account with:
- **Username:** `admin`
- **Password:** `admin`

**Change this password after first login in production!**

### 8. Seed Sample Menu Data
```bash
python seed_menu.py
```

This adds sample burger menu ingredients to test the system.

---

## Running the Application

### Start the Server
```bash
python app.py
```
or 
```bash
export FLASK_APP
flask run
```

You should see:
```bash
* Running on http://127.0.0.1:5000
* Debug mode: on
```

### Access the Application

Open your browser and go to:
```bash
http://localhost:5000
```
or bash
```
http://127.0.0.1:5000
```
---
## Command Reference & Function Overview

Below is a detailed guide to all the key commands

### Application Commands

| Command | Description | Example |
|----------|--------------|----------|
| `python app.py` | Runs the Flask development server locally. | `python app.py` |
| `flask run` | Starts the app using Flask CLI with automatic reloading. | `flask run --debug` |
| `python seed_menu.py` | Populates the `menu_items` table in the database with sample data from `menu_items.csv`. | `python seed_menu.py` |
| `python create_admin.py` | Creates an admin user account with default credentials. | `python create_admin.py` |
| `pytest` | Runs all automated test suites across controllers, routes, and models. | `pytest -v` |

---

## Function Reference

Below is a detailed list of core controller functions in our backend architecture.

| **Controller** | **Function** | **Description** |
|----------------|--------------|-----------------|
| **AuthController** | `register_user(username, password, role='customer')` | Registers a new user with role validation (only admins can assign elevated roles). |
|  | `login_user_account(username, password)` | Authenticates users and logs them into the session. |
|  | `logout_user_account()` | Logs the current user out. |
|  | `get_all_users()` | Retrieves all users from the database. |
|  | `update_user_role(user_id, new_role)` | Updates the role of an existing user. |
|  | `delete_user(user_id)` | Deletes a user account from the system. |
| **MenuController** | `get_all_items()` | Retrieves all menu items in sorted order. |
|  | `get_item_by_id(item_id)` | Fetches a specific menu item by ID. |
|  | `create_item(name, category, description, price, ...)` | Creates a new menu item (Admin/Staff only). |
|  | `update_item(item_id, ...)` | Updates an existing menu item (Admin/Staff only). |
|  | `delete_item(item_id)` | Deletes a menu item (Admin only). |
|  | `toggle_availability(item_id)` | Toggles menu item availability (Admin/Staff only). |
|  | `toggle_healthy_choice(item_id)` | Marks/unmarks a menu item as a healthy choice (Admin/Staff only). |
|  | `get_items_by_category(category)` | Retrieves menu items filtered by category. |
|  | `get_available_items()` | Retrieves only available menu items (for customers). |
|  | `get_healthy_choices()` | Retrieves items marked as healthy choices. |
| **OrderController** | `get_user_orders(user_id)` | Retrieves all past orders for a user. |
|  | `create_new_order(user_id, item_data)` | Creates a new order and calculates total price. |
| **StatusController** | `get_status_flow()` | Returns status flow mapping for frontend use. |
|  | `update_order_status(order_id, new_status)` | Updates order status through valid transitions. |
|  | `cancel_order(order_id, user_id)` | Cancels a pending or preparing order. |
|  | `get_order_by_id(order_id, user_id)` | Retrieves an order by ID (with user access check). |
|  | `get_all_orders_for_staff()` | Fetches all orders for staff/admin dashboards. |
|  | `is_staff(user_id)` | Checks if a user is a staff or admin member. |

---

### Configuration Options (`config.py`)

| Option | Description | Example Value |
|---------|--------------|---------------|
| `SQLALCHEMY_DATABASE_URI` | MySQL connection string | `mysql+pymysql://root:password@localhost/stackshack_db` |
| `SECRET_KEY` | Flask app secret key used for sessions and CSRF protection | `'my-secret-key'` |
| `DEBUG` | Enables or disables Flask debug mode | `True` |
| `TESTING` | Enables testing mode during CI/CD | `False` |

---

### Testing Commands

| Command | Description | Example |
|----------|--------------|----------|
| `pytest tests/menuManagementTests/` | Runs all tests related to menu management. | `pytest tests/menuManagementTests/` |
| `pytest tests/LoginManagementTests/` | Runs authentication-related tests. | `pytest tests/LoginManagementTests/` |
| `pytest tests/purchaseManagementTests/` | Runs tests for order and purchase flows. | `pytest tests/purchaseManagementTests/` |
| `pytest tests/statusManagementTests/` | Runs tests for order status flows. | `pytest tests/statusManagementTests/` |
| `pytest --cov=controllers` | Checks test coverage for all controller functions. | `pytest --cov=controllers` |

---

### Dependency Management

| Command | Description | Example |
|----------|--------------|----------|
| `pip install -r requirements.txt` | Installs all Python dependencies. | `pip install -r requirements.txt` |

---

### Database Setup

| Step | Command | Description |
|------|----------|-------------|
| 1 | `flask db init` | Initialize the database migration directory. |
| 2 | `flask db migrate -m "Initial migration"` | Create migration scripts based on models. |
| 3 | `flask db upgrade` | Apply migrations and create all tables. |

---

## Testing Database connection

```bash
python test_conn.py
```

Should output: `Connected to MySQL successfully!`

---

## Running the Test Suite

To verify that all components are working correctly, you can run the project's built-in test suite.

1.  Make sure you are in the `proj2/` directory.
2.  Install `pytest` (if not already in `requirements.txt`):
    ```bash
    pip install pytest
    ```
3.  Run the tests using the following command (this sets the correct path for imports):
    ```bash
    PYTHONPATH=./stackshack python -m pytest stackshack/tests
    ```
    or run the below command to get the test case suite results in a html file:
    ```
    python -m pytest stackshack/tests/ --html=test-results.html --self-contained-html
    ```

---


## Usage

### Demo Scenario: Customer places an order

**What do you have to do?**

#### Login

1. Navigate to:  
   `http://localhost:5000/auth/login`
2. Enter credentials:  
   - **Username:** `customer`  
   - **Password:** `pwstrong`
3. Click **Login**

![user login demo](stackshack/static/images/user_login.png)
![user register demo](stackshack/static/images/user_register.png)
#### Create and Place Order

1. Go to:  
   `http://127.0.0.1:5000/orders/new`
2. Build your burger by selecting buns, patties, toppings, sauces, and cheese.
3. Review the order summary and confirm total price.
4. Click **Place Order**.
5. Track the order status in:  
   `http://127.0.0.1:5000/orders/history`
6. Logout once done.
 ![View ingredients](stackshack/static/images/view_ingredients.png)
![Customer Order Demo](stackshack/static/images/purchase_burger_ss.png)

---

### Demo Scenario: Admin manages menu and user roles

**What do you have to do?**

#### Login as Admin

1. Navigate to:  
   `http://localhost:5000/auth/login`
2. Enter credentials:  
   - **Username:** `admin`  
   - **Password:** `admin`
3. Click **Login**

#### Manage Menu

1. Access **Dashboard → Manage Menu**
2. Perform actions like:
   - **Add New Item** – Click “+ Add New Menu Item”
   - **Edit Item** – Modify existing items
   - **Delete Item** – Remove items (admin only)
   - **Toggle Availability** – Enable/disable menu items
   - **Mark Healthy Choice** – Highlight healthy options

![admin manage menu demo](stackshack/static/images/manage_menu.png)

#### Manage Users

1. Access **Dashboard → Manage Users**
2. Update roles for existing users (promote to staff, demote to customer).
3. Remove inactive users if required.

![admin manage user demo](stackshack/static/images/manage_user2.png)
---

### Demo Scenario: Staff updates order statuses

**What do you have to do?**

#### Login as Staff

1. Navigate to:  
   `http://localhost:5000/auth/login`
2. Enter credentials:  
   - **Username:** `staff`  
   - **Password:** `staffpw`
3. Click **Login**

#### Manage Orders

1. Go to **Dashboard → Orders**
2. You can:
   - **View All Orders** with current status
   - **Update Status** through transitions:
     - Pending → Preparing  
     - Preparing → Ready for Pickup  
     - Ready for Pickup → Delivered
3. Once delivered, mark as **Completed**
![ Staff manage order](stackshack/static/images/status_mgmt.png)

#### Customer Viewing Order Status

![Customer manage order](stackshack/static/images/status_check.png)
![Customer manage order](stackshack/static/images/status_map.png)

### Menu Item Categories

- **Bun** - Bread options
- **Patty** - Protein choices
- **Cheese** - Cheese varieties
- **Topping** - Vegetables and extras
- **Sauce** - Condiments

---

## Configuration

### Database Configuration

Edit `config.py` to change database settings. By default, it reads from `.env` file.

---

## API References


This section provides an overview of all major RESTful endpoints implemented in the **StackShack Burger Ordering System**.
### Authentication & User Management (`auth_routes.py`)

| Endpoint | Method | Description | Access |
|-----------|---------|-------------|---------|
| `/register` | `GET`, `POST` | Registers a new user account. Defaults to `customer` role unless an admin is logged in. | Public / Admin |
| `/login` | `GET`, `POST` | Authenticates a user and starts a session. Redirects to dashboard upon success. | Public |
| `/logout` | `GET` | Logs out the current user and clears session. | Authenticated |
| `/dashboard` | `GET` | Displays a user dashboard with user-specific info and admin options. | Authenticated |
| `/admin/create-user` | `GET`, `POST` | Admin-only route to create new staff or admin accounts. | Admin |
| `/admin/manage-users` | `GET`, `POST` | Admin-only panel to view, update roles, or delete users. | Admin |

#### Example JSON (POST `/register`)
```json
{
  "username": "john_doe",
  "password": "password123",
  "role": "customer"
}
```
response
```
{
  "success": true,
  "message": "User registered successfully."
}
```
### Menu Management Routes

| HTTP Method | Route | Description | Access Level |
|--------------|--------|-------------|---------------|
| GET | `/menu/items` | View all menu items | Admin / Staff |
| GET | `/menu/items/new` | Display form to create a new item | Admin / Staff |
| POST | `/menu/items/create` | Create a new menu item | Admin / Staff |
| GET | `/menu/items/<item_id>/edit` | Display edit form for an item | Admin / Staff |
| POST | `/menu/items/<item_id>/update` | Update an existing menu item | Admin / Staff |
| POST | `/menu/items/<item_id>/delete` | Delete a menu item | Admin only |
| POST | `/menu/items/<item_id>/toggle-availability` | Toggle availability of a menu item | Admin / Staff |
| POST | `/menu/items/<item_id>/toggle-healthy` | Toggle healthy choice flag | Admin / Staff |
| GET | `/menu/browse` | Browse all available items (customer view) | Public |
| GET | `/menu/healthy` | View healthy menu choices | Public |
| GET | `/menu/browse-ingredients` | Browse available ingredients grouped by category | Public |
#### Example JSON (POST /menu/items/create)
```{
  "name": "Sesame Bun",
  "category": "bun",
  "description": "Soft and fresh sesame seed bun",
  "price": 2.50,
  "calories": 180,
  "protein": 6,
  "image_url": "/static/images/sesame_bun.jpg"
}
```
response
```
{
  "success": true,
  "message": "Menu item created successfully"
}
```
### Order Management Routes

| HTTP Method | Route | Description | Access Level |
|--------------|--------|-------------|---------------|
| GET | `/order/history` | View logged-in user’s past orders | Customer |
| GET | `/order/ingredients/<category>` | Retrieve ingredients by category (JSON response) | Public |
| GET | `/order/new` | Display burger creation/order form | Customer |
| POST | `/order/place` | Submit and place a new order | Customer |
#### Example JSON (GET /order/ingredients/bun)
```
[
  {
    "id": 1,
    "name": "Sesame Bun",
    "price": 2.50,
    "description": "Soft sesame bun",
    "is_healthy": false,
    "image_url": "/static/images/sesame_bun.jpg"
  },
  {
    "id": 2,
    "name": "Whole Wheat Bun",
    "price": 3.00,
    "description": "Rich in fiber and nutrients",
    "is_healthy": true,
    "image_url": "/static/images/whole_wheat_bun.jpg"
  }
]
```
#### Example JSON (POST /order/place)
```
{
  "user_id": 5,
  "items": [
    {
      "item_id": 1,
      "name": "Sesame Bun",
      "price": 2.5,
      "quantity": 1
    },
    {
      "item_id": 7,
      "name": "Beef Patty",
      "price": 5.0,
      "quantity": 1
    }
  ]
}
```
response
```
{
  "success": true,
  "message": "Order placed successfully!"
}
```

## Data Import and Export

**StackShack**: All data formats follow **open standards** (CSV, JSON) ensuring easy integration with other databases or analytics tools.

- 📂 **Data Import:**  
  - Menu items, orders, and users can be imported from `.csv` or `.json` files.  

- 📤 **Data Export:**  
  - Application data (menu, order history, user records) can be exported to `.csv` or `.json` for interoperability with other systems. 

## Open Communications Protocols

**StackShack** communicates using **open and standard web protocols**:

- The application runs on **HTTP/HTTPS** using REST-style Flask routes.
- All client–server interactions use **JSON** as the data-interchange format.
- The API endpoints can be accessed by any system that supports standard HTTP requests.

---

## Troubleshooting

### "Access denied for user 'root'@'localhost'"

**Problem:** MySQL password is incorrect in `.env` file.

**Solution:** Update `DB_PASSWORD` in `.env` with your correct MySQL password.

### "ModuleNotFoundError: No module named 'dotenv'"

**Problem:** `python-dotenv` not installed.

**Solution:**
```bash
pip install python-dotenv
```

### "No module named 'flask'"

**Problem:** Virtual environment not activated or dependencies not installed.

**Solution:**
```bash
source venv/Scripts/activate  # Activate venv
pip install -r requirements.txt
```

### "Table 'stackshack.menu_items' doesn't exist"

**Problem:** Database tables not created.

**Solution:** Run the database initialization commands from step 6.

### Port 5000 Already in Use

**Problem:** Another application is using port 5000.

**Solution:** Kill the process or change the port in `app.py`:
```python
app.run(debug=True, port=5001)  # Use different port
```
---

## Portability Check

Tested on macOS, Windows and Linux laptops using Python 3.8+.

---

## Coding Conventions - Python Style
- Code follows **PEP 8** conventions.
- Used **meaningful variable and function names** for readability.
- Classes are written in **PascalCase** (e.g., `MenuItem`, `OrderController`).
- Functions and variables use **snake_case** (e.g., `get_available_items`, `is_healthy_choice`).
- Each route and controller function has **docstrings** explaining purpose.
- All database models follow SQLAlchemy ORM conventions.

---

## Milestones

- [x] User Management (Authentication & Authorization of customers, admins and staff)
- [x] Menu Management (Add/Edit/Delete Items and item information)
- [x] Order Purchase (Build a Burger and place order)
- [x] Order Status Management (Customer - check order status; Staff - update order status)

---

## Future Enhancements

- Surprise box (randomised burger ingredients based on customer nutritional preferences and trending recommendations)
- Nutritional calculator, dietary restriction filters and customer preferences
- Payment integration
- Inventory (ingredients availability) management

---

## Security Notes

- Never commit `.env` file to Git
- Change default admin password after first login
- Use strong passwords in production
- Keep dependencies up to date

---

## License

This project is for educational purposes as part of CSC 510. StackShack is a student academic project and so there are no trademark claims.

---

## How to Cite

If you use *StackShack* in your work, please cite it with DOI: [10.5281/zenodo.1234567](https://doi.org/10.5281/zenodo.1234567)  

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Contact team members for queries/help @ https://discord.gg/R9bttnvf
3. Check the [GitHub Issues](https://github.com/Shorse321/CSC510Group24/issues)

---

## Team

**Group 24**
- Adam Myers
- Akash R
- Sailesh Sridhar
- Swetha Manivasagam

Project maintained by 4 contributors; pull requests reviewed by maintainers. Contributors retain rights to their code contributions.

**Course:** CSC 510 - Software Engineering

---

**Happy Stacking! 🍔**
