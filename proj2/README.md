# 🍔 Stack Shack - Build Your Own Burger

Stack Shack is a campus dining management system that allows customers to build custom burgers and enables staff/admins to manage the menu efficiently. Built with Flask (Python) backend and a clean HTML/CSS frontend.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Team](#team)

---

## ✨ Features

### For Customers
- Browse available menu items
- View nutritional information (calories, protein)
- See healthy choice options
- Custom burger builder (coming soon)

### For Staff
- Manage menu items (add, edit, view)
- Toggle item availability
- Mark items as healthy choices

### For Admins
- Full menu management (including delete)
- User management
- Create staff/admin accounts

---

## 🛠️ Tech Stack

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

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
- **MySQL 8.0 or higher** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download Git](https://git-scm.com/downloads)

---

## 🚀 Installation

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

**⚠️ Important:** Replace `your_mysql_password` with your actual MySQL password!

### 6. Initialize the Database
```bash
python
```

Then in the Python shell:
```python
from app import create_app
from database.db import db
from models.user import User
from models.menu_item import MenuItem

app = create_app()
with app.app_context():
    db.create_all()
    print("✅ Database tables created!")
exit()
```

### 7. Create Admin User
```bash
python create_admin.py
```

This creates an admin account with:
- **Username:** `admin`
- **Password:** `admin`

⚠️ **Change this password after first login in production!**

### 8. (Optional) Seed Sample Menu Data
```bash
python seed_menu.py
```

This adds sample burger ingredients to test the system.

---

## 🏃 Running the Application

### Start the Server
```bash
python app.py
```

You should see:
```
* Running on http://127.0.0.1:5000
* Debug mode: on
```

### Access the Application

Open your browser and go to:
```
http://localhost:5000
```

---

## 📖 Usage

### Login as Admin

1. Navigate to `http://localhost:5000/auth/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `admin`
3. Click **Login**

### Manage Menu Items

1. After login, click **Dashboard**
2. Click **Manage Menu** under Admin Tools
3. You can now:
   - **Add New Item** - Click "+ Add New Menu Item"
   - **Edit Item** - Click "Edit" next to any item
   - **Delete Item** - Click "Delete" (admin only)
   - **Toggle Availability** - Mark items as available/unavailable
   - **Mark Healthy Choice** - Tag healthy options

### Menu Item Categories

- **Bun** - Bread options
- **Patty** - Protein choices
- **Cheese** - Cheese varieties
- **Topping** - Vegetables and extras
- **Sauce** - Condiments

---

## 📁 Project Structure
```
stackshack/
├── controllers/           # Business logic
│   ├── auth_controller.py
│   └── menu_controller.py
├── database/             # Database configuration
│   └── db.py
├── models/               # Database models
│   ├── user.py
│   └── menu_item.py
├── routes/               # URL routing
│   ├── auth_routes.py
│   └── menu_routes.py
├── templates/            # HTML templates
│   ├── menu/
│   │   ├── items.html
│   │   ├── create_item.html
│   │   └── edit_item.html
│   ├── base.html
│   ├── home.html
│   └── dashboard.html
├── venv/                 # Virtual environment (not in Git)
├── .env                  # Environment variables (not in Git)
├── .gitignore           # Git ignore rules
├── app.py               # Main application file
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

---

## 🔧 Configuration

### Database Configuration

Edit `config.py` to change database settings. By default, it reads from `.env` file.

### Adding New Menu Categories

To add new categories, update the ENUM in `models/menu_item.py`:
```python
category = db.Column(db.Enum('bun', 'patty', 'cheese', 'topping', 'sauce', 'drink'), nullable=False)
```

Then update the dropdown in templates.

---

## 🧪 Testing

### Test Database Connection
```bash
python test_conn.py
```

Should output: `✅ Connected to MySQL successfully!`

### Manual Testing Checklist

- [ ] Admin can login
- [ ] Admin can create menu items
- [ ] Admin can edit menu items
- [ ] Admin can delete menu items
- [ ] Admin can toggle availability
- [ ] Admin can mark healthy choices
- [ ] Staff can manage items (but not delete)
- [ ] Customers can view available items

---

## 🐛 Troubleshooting

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

## 👥 Team

**Group 24**
- Adam Myers
- Akash R
- Sailesh Sridhar
- Swetha Manivasagam

**Course:** CSC 510 - Software Engineering

---

## 📝 Milestones

- [x] User Management (Authentication & Authorization)
- [x] Menu Management (Add/Edit/Delete Items)
- [ ] Order Management (Build a Burger)
- [ ] Order Purchase (Payment Processing)
- [ ] Extended Features (Inventory, Preferences, Surprise Box)

---

## 🔐 Security Notes

- Never commit `.env` file to Git
- Change default admin password after first login
- Use strong passwords in production
- Keep dependencies up to date

---

## 📄 License

This project is for educational purposes as part of CSC 510.

---

## 🆘 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Contact team members
3. Check the [GitHub Issues](https://github.com/Shorse321/CSC510Group24/issues)

---

## 🎯 Future Enhancements

- Customer burger builder interface
- Real-time order tracking
- Nutritional calculator
- Payment integration
- Mobile responsive design
- Order history
- Dietary restriction filters

---

**Happy Coding! 🍔**