import os
import secrets # Import the secrets module

class Config:
    # Production uses environment or a hardcoded key for session continuity
    SECRET_KEY = os.environ.get('SECRET_KEY', 'stackshack_secret_key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Enforce strong session protection
    SESSION_PROTECTION = 'strong' 
    

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL') or
        'mysql+pymysql://root:root@localhost:3306/stackshack'
    )
    # FIX: Override SECRET_KEY to generate a new key on every run.
    # This invalidates previous session cookies on app restart, forcing a logout.
    SECRET_KEY = secrets.token_urlsafe(32)


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}