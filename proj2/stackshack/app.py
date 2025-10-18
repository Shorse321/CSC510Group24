from flask import Flask
from config import config
from database.db import init_db, login_manager
from routes.auth_routes import auth_bp
from models.user import User

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    init_db(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    app.register_blueprint(auth_bp, url_prefix='/auth')

    @app.route('/')
    def home():
        return "<h2>Welcome to Stack Shack!</h2><a href='/auth/login'>Login</a>"

    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True)