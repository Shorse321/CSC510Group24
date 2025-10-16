# Stack Shack - Menu Management Backend

## Setup Instructions

### Prerequisites
- Python 3.8+
- MySQL installed and running

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd stackshack-backend
```

2. Create virtual environment
```bash
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash
# OR
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# OR
source venv/bin/activate       # Mac/Linux
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Create `.env` file
```
FLASK_APP=app.py
FLASK_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stackshack
```

5. Run the server
```bash
python app.py
```

Server will run on `http://localhost:5000`

## API Endpoints
(Documentation coming soon)
```

---

### **Step 3: Update `requirements.txt`**

Make sure your `requirements.txt` has all dependencies:
```
flask
flask-cors
mysql-connector-python
python-dotenv