from flask import Flask, render_template # Added render_template here
from config import config
from database.db import init_db, login_manager
from routes.auth_routes import auth_bp
from routes.menu_routes import menu_bp
from models.user import User

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    init_db(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(menu_bp, url_prefix='/menu')

    @app.route('/')
    def home():
        # Render the new home.html template
        return render_template('home.html')
    
    # New route for the menu page
    @app.route('/menu')
    def menu():
        return render_template('menu.html')

    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True)