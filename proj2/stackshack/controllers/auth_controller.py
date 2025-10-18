from models.user import User
from database.db import db
from flask_login import login_user, logout_user, current_user

class AuthController:

    @staticmethod
    def register_user(username, password, role='customer'):
        if User.get_by_username(username):
            return False, "Username already exists", None

        if not username or not password:
            return False, "Username and password required", None

        # Only admins can assign elevated roles
        if role in ['admin', 'staff']:
            if not current_user.is_authenticated or current_user.role != 'admin':
                return False, "Unauthorized: Only admins can assign elevated roles.", None

        try:
            user = User(username=username, role=role)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            return True, f"{user.role.capitalize()} user created successfully.", user
        except Exception as e:
            db.session.rollback()
            return False, f"Error: {str(e)}", None

    @staticmethod
    def login_user_account(username, password):
        user = User.get_by_username(username)
        if not user or not user.check_password(password):
            return False, "Incorrect username or password.", None
        login_user(user)
        return True, "Login successful", user

    @staticmethod
    def logout_user_account():
        logout_user()
        return True, "Logged out successfully."

    @staticmethod
    def get_all_users():
        return User.query.all()

    @staticmethod
    def update_user_role(user_id, new_role):
        user = User.query.get(user_id)
        if not user:
            return False, "User not found"
        user.role = new_role
        db.session.commit()
        return True, "Role updated successfully"

    @staticmethod
    def delete_user(user_id):
        user = User.query.get(user_id)
        if not user:
            return False, "User not found"
        db.session.delete(user)
        db.session.commit()
        return True, "User deleted successfully"