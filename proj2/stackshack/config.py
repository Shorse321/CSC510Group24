import os
import secrets
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'stackshack_secret_key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_PROTECTION = 'strong'

class DevelopmentConfig(Config):
    DEBUG = True
    
    # Build database URI from environment variables
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_NAME = os.environ.get('DB_NAME', 'stackshack')
    
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL') or
        f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:3306/{DB_NAME}'
    )
    
    SECRET_KEY = secrets.token_urlsafe(32)

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    
    # REMOVED the strict check:
    # if not SQLALCHEMY_DATABASE_URI:
    #     raise ValueError("No DATABASE_URL set for Production environment.")
    
    # The application will now rely on the deployment environment to set DATABASE_URL. 
    # If not set, Flask-SQLAlchemy will fail on connection, which is fine for production.
    pass

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}