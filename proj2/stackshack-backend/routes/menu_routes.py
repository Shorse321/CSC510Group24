from flask import Blueprint, request, jsonify
from controllers.menu_controller import (
    get_all_items,
    get_item_by_id,
    create_item,
    update_item,
    delete_item,
    toggle_availability,
    toggle_healthy_choice
)

# Create a Blueprint (like a mini Flask app for menu routes)
menu_bp = Blueprint('menu', __name__)


# GET /api/menu/items - Get all menu items
@menu_bp.route('/items', methods=['GET'])
def get_items():
    """Retrieve all menu items"""
    items = get_all_items()
    return jsonify({
        'success': True,
        'data': items
    }), 200


# GET /api/menu/items/<id> - Get single menu item
@menu_bp.route('/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Retrieve a specific menu item by ID"""
    item = get_item_by_id(item_id)
    
    if item is None:
        return jsonify({
            'success': False,
            'message': 'Item not found'
        }), 404
    
    return jsonify({
        'success': True,
        'data': item
    }), 200


# POST /api/menu/items - Create new menu item
@menu_bp.route('/items', methods=['POST'])
def create_new_item():
    """Create a new menu item"""
    data = request.get_json()
    
    # Validation
    if not data.get('name') or not data.get('category') or not data.get('price'):
        return jsonify({
            'success': False,
            'message': 'Missing required fields: name, category, price'
        }), 400
    
    new_item_id = create_item(data)
    
    if new_item_id:
        return jsonify({
            'success': True,
            'message': 'Item created successfully',
            'data': {'id': new_item_id}
        }), 201
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to create item'
        }), 500


# PUT /api/menu/items/<id> - Update menu item
@menu_bp.route('/items/<int:item_id>', methods=['PUT'])
def update_existing_item(item_id):
    """Update an existing menu item"""
    data = request.get_json()
    
    # Validation
    if not data.get('name') or not data.get('category') or not data.get('price'):
        return jsonify({
            'success': False,
            'message': 'Missing required fields: name, category, price'
        }), 400
    
    rows_affected = update_item(item_id, data)
    
    if rows_affected and rows_affected > 0:
        return jsonify({
            'success': True,
            'message': 'Item updated successfully'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Item not found or no changes made'
        }), 404


# DELETE /api/menu/items/<id> - Delete menu item
@menu_bp.route('/items/<int:item_id>', methods=['DELETE'])
def delete_existing_item(item_id):
    """Delete a menu item"""
    rows_affected = delete_item(item_id)
    
    if rows_affected and rows_affected > 0:
        return jsonify({
            'success': True,
            'message': 'Item deleted successfully'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Item not found'
        }), 404


# PATCH /api/menu/items/<id>/availability - Toggle availability
@menu_bp.route('/items/<int:item_id>/availability', methods=['PATCH'])
def toggle_item_availability(item_id):
    """Toggle the availability status of a menu item"""
    rows_affected = toggle_availability(item_id)
    
    if rows_affected and rows_affected > 0:
        return jsonify({
            'success': True,
            'message': 'Availability toggled successfully'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Item not found'
        }), 404


# PATCH /api/menu/items/<id>/healthy - Toggle healthy choice
@menu_bp.route('/items/<int:item_id>/healthy', methods=['PATCH'])
def toggle_item_healthy(item_id):
    """Toggle the healthy choice status of a menu item"""
    rows_affected = toggle_healthy_choice(item_id)
    
    if rows_affected and rows_affected > 0:
        return jsonify({
            'success': True,
            'message': 'Healthy choice status toggled successfully'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Item not found'
        }), 404