from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from controllers.auth_controller import AuthController

auth_bp = Blueprint('auth', __name__)

# User registration
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        role = 'customer'

        if current_user.is_authenticated and current_user.role == 'admin':
            role = request.form.get('role', 'customer')

        success, msg, _ = AuthController.register_user(username, password, role)
        flash(msg, 'success' if success else 'error')

        if success:
            return redirect(url_for('auth.login'))
    return render_template('register.html')


# Login route
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('auth.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        success, msg, _ = AuthController.login_user_account(username, password)
        flash(msg, 'success' if success else 'error')

        if success:
            return redirect(url_for('auth.dashboard'))
    return render_template('login.html')


# Dashboard
@auth_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)


# Logout
@auth_bp.route('/logout')
@login_required
def logout():
    success, msg = AuthController.logout_user_account()
    flash(msg, 'success')
    return redirect(url_for('auth.login'))


# Admin-only: Create users
@auth_bp.route('/admin/create-user', methods=['GET', 'POST'])
@login_required
def create_user_admin():
    if current_user.role != 'admin':
        flash("Unauthorized access", "error")
        return redirect(url_for('auth.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        role = request.form.get('role', 'staff')

        success, msg, _ = AuthController.register_user(username, password, role)
        flash(msg, 'success' if success else 'error')

    return render_template('admin_create.html')


# Admin-only: Manage users (view, edit, delete)
@auth_bp.route('/admin/manage-users', methods=['GET', 'POST'])
@login_required
def manage_users():
    if current_user.role != 'admin':
        flash("Unauthorized access", "error")
        return redirect(url_for('auth.dashboard'))

    users = AuthController.get_all_users()

    if request.method == 'POST':
        if 'update_role' in request.form:
            user_id = request.form.get('user_id')
            new_role = request.form.get('role')
            AuthController.update_user_role(user_id, new_role)
            flash("Role updated successfully", "success")

        elif 'delete_user' in request.form:
            user_id = request.form.get('user_id')
            AuthController.delete_user(user_id)
            flash("User deleted successfully", "success")

        return redirect(url_for('auth.manage_users'))

    return render_template('admin_manage.html', users=users)