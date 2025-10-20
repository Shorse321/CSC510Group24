from flask import Flask, render_template 
from config import config
from database.db import init_db, login_manager
from routes.auth_routes import auth_bp
from routes.menu_routes import menu_bp
from models.user import User

def create_app(config_name='development'):
    """
    Factory function for creating and configuring the Flask application instance.

    Args:
        config_name (str, optional): The configuration profile to use 
                                     ('development' or 'production'). Defaults to 'development'.

    Returns:
        Flask: The configured Flask application instance.
    """
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    init_db(app)

    @login_manager.user_loader
    def load_user(user_id):
        """
        Required callback function for Flask-Login. Loads a user from the database 
        given a user ID (from the session).

        Args:
            user_id (int): The ID of the user to load.

        Returns:
            User or None: The User object.
        """
        return User.query.get(int(user_id))

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(menu_bp, url_prefix='/menu')

    @app.route('/')
    def home():
        """
        The main homepage route for the application.

        Returns:
            str: Renders the home.html template.
        """
        return render_template('home.html')
    
    @app.route('/menu')
    def menu():
        """
        The public-facing menu page route. (Currently a placeholder).

        Returns:
            str: Renders the menu.html template.
        """
        return render_template('menu.html')

    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True)