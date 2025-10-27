# stackshack/conftest.py
import pytest
from app import create_app
from database.db import db
from models.user import User
from sqlalchemy.orm import Session # Import Session for explicit control

# The majority of the test files' 32 passed tests depend on the initial setup in app().

@pytest.fixture(scope='session')
def app():
    """Session-scoped application fixture configured for testing."""
    app = create_app('development')
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 
        'SECRET_KEY': 'testing_secret_key' 
    })
    
    with app.app_context():
        
        # Ensure all tables are created
        db.create_all()
        
        # Create initial test users for RBAC testing
        admin = User(username='test_admin', role='admin')
        admin.set_password('adminpass')
        
        customer = User(username='test_customer', role='customer')
        customer.set_password('customerpass')
        
        staff = User(username='test_staff', role='staff')
        staff.set_password('staffpass')
        
        db.session.add_all([admin, customer, staff])
        db.session.commit()

    yield app

    with app.app_context():
        # Cleanup: drop all tables
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Function-scoped test client fixture."""
    return app.test_client()

@pytest.fixture
def login(client):
    """Helper function to log in a user."""
    def _login(username, password):
        return client.post('/auth/login', data=dict(
            username=username,
            password=password
        ), follow_redirects=True)
    return _login

@pytest.fixture
def create_test_item():
    """Placeholder for excluded menu tests fixture."""
    return lambda: None


# CRITICAL FIX: Refactored db_session fixture to use db.session.remove()
# This fixes the AttributeError that caused the 9 Errors.
@pytest.fixture
def db_session(app):
    """Function-scoped database session fixture for transactional testing."""
    with app.app_context():
        
        # 1. Open a connection and start an overall transaction
        connection = db.engine.connect()
        transaction = connection.begin()
        
        # 2. Clear the current session scope and bind the test connection
        # FIX: Use the correct Flask-SQLAlchemy API: db.session.remove()
        db.session.remove() 
        db.session.bind = connection
        
        # 3. Use savepoint (nested transaction) for proper rollback within the test
        db.session.begin_nested() 
        
        yield db.session

        # 4. Cleanup: Rollback the nested transaction first
        if db.session.is_active:
            db.session.rollback()
        
        # 5. Rollback the outer transaction to wipe test changes from the database
        transaction.rollback()
        
        # 6. Close the connection
        connection.close()