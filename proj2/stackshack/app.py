from flask import Flask, render_template 
from config import config
from database.db import init_db, login_manager, db 
from routes.auth_routes import auth_bp
from routes.menu_routes import menu_bp
from routes.order_routes import order_bp # NEW IMPORT
from models.user import User

# NEW IMPORTS: Import models so SQLAlchemy can discover them
from models.order import Order, OrderItem 
from models.menu_item import MenuItem

def create_app(config_name='development'):
    """
    Factory function for creating and configuring the Flask application instance.
    ...
    """
    app = Flask(__name__) 
    app.config.from_object(config[config_name])

    init_db(app)
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.jinja_env.auto_reload = True
    app.jinja_env.cache = {}
    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(menu_bp, url_prefix='/menu')
    app.register_blueprint(order_bp, url_prefix='/orders') # NEW ROUTE REGISTRATION

    @app.route('/')
    def home():
        return render_template('home.html')
    
    @app.route('/menu')
    def menu():
        return render_template('menu.html')

    return app
    
if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, host='0.0.0.0', port=5000)
