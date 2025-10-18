from app import create_app
from database.db import db
from models.user import User

app = create_app()
with app.app_context():
    # Create admin user (1st time only)
    admin = User(username='admin', role='admin')
    admin.set_password('admin')  # Use a secure password
    db.session.add(admin)
    db.session.commit()
    print("Admin user created")