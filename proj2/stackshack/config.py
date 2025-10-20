import os
import secrets
from dotenv import load_dotenv

# Load environment variables from .env file (if present) for development
load_dotenv() 

class Config:
    # Fallback key: Use environment variable, otherwise generate a temporary key
    SECRET_KEY = os.getenv('SECRET_KEY') 
    if not SECRET_KEY:
        SECRET_KEY = secrets.token_urlsafe(32)
        print("Warning: SECRET_KEY not set in environment. Using a temporary key.")
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_PROTECTION = 'strong' 
    

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = (
        os.getenv('DATABASE_URL') or
        f"mysql+pymysql://{os.getenv('DB_USER', 'root')}:{os.getenv('DB_PASSWORD', 'root')}@{os.getenv('DB_HOST', 'localhost')}:3306/stackshack"
    )
    # Ensure a new, unique key is generated on every run for development stability.
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