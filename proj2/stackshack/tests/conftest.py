# proj2/stackshack/tests/conftest.py
import pytest
import os
import sys
from sqlalchemy.orm import Session 

# CRITICAL FIX 1: Add the parent package (stackshack) to sys.path. 
# This tells Python where to find the 'stackshack' package root and resolves ModuleNotFoundError.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Use definitive ABSOLUTE imports
from stackshack.app import create_app
from stackshack.database.db import db
from stackshack.models.user import User
from stackshack.models.menu_item import MenuItem 


@pytest.fixture(scope='session')
def app():
    """Session-scoped application fixture configured for testing."""
    # CRITICAL FIX 2: Explicitly call create_app('testing') to use SQLite in-memory, 
    # resolving the MySQL OperationalError.
    app = create_app('testing') 
    
    # Note: The 'testing' config should already contain the SQLite URI, 
    # but we add the update block here for maximum resilience.
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 
        'SECRET_KEY': 'testing_secret_key' 
    })
    
    with app.app_context():
        
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
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def login(client):
    def _login(username, password):
        return client.post('/auth/login', data=dict(
            username=username,
            password=password
        ), follow_redirects=True)
    return _login

@pytest.fixture
def create_test_item():
    return lambda: None


@pytest.fixture
def db_session(app):
    """Function-scoped database session fixture for transactional testing."""
    with app.app_context():
        
        connection = db.engine.connect()
        transaction = connection.begin()
        
        db.session.remove() 
        db.session.bind = connection
        
        db.session.begin_nested() 
        
        yield db.session

        if db.session.is_active:
            db.session.rollback()
        
        transaction.rollback()
        
        connection.close()