from app import create_app
from database.db import db
from models.user import User

app = create_app()
with app.app_context():
    # Create admin user
    admin = User(username='admin', role='admin')
    # IMPORTANT: Use a secure, temporary password. Change it immediately after first login.
    admin.set_password('admin') 
    db.session.add(admin)
    db.session.commit()
    print("Admin user created")