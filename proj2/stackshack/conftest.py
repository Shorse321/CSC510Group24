# stackshack/conftest.py
import pytest
from app import create_app
from database.db import db
from models.user import User
# The MenuController is not used, but the model is required for the placeholder fixture
from models.menu_item import MenuItem 

@pytest.fixture(scope='session')
def app():
    """Session-scoped application fixture configured for testing."""
    # Use in-memory SQLite for fast testing
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
def db_session(app):
    """Function-scoped database session fixture that cleans up via transaction rollback."""
    with app.app_context():
        # Use nested transaction for isolation
        connection = db.engine.connect()
        transaction = connection.begin()
        db.session.begin_nested() 
        db.session.configure(bind=connection)
        
        yield db.session

        # Rollback the nested transaction to undo test changes
        db.session.remove()
        transaction.rollback()
        connection.close()

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
    """Placeholder for excluded menu tests fixture (required to avoid import errors in other files)."""
    return lambda: None