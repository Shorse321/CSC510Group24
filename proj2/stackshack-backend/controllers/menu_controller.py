from config.database import execute_query

# Get all menu items
def get_all_items():
    """
    Fetch all menu items from database
    Returns: List of menu items as dictionaries
    """
    query = "SELECT * FROM menu_items ORDER BY category, name"
    items = execute_query(query, fetch=True)
    return items if items else []


# Get single menu item by ID
def get_item_by_id(item_id):
    """
    Fetch a specific menu item
    Args: item_id - The ID of the item to fetch
    Returns: Dictionary with item data or None
    """
    query = "SELECT * FROM menu_items WHERE id = %s"
    items = execute_query(query, params=(item_id,), fetch=True)
    return items[0] if items else None


# Create new menu item
def create_item(data):
    """
    Insert a new menu item into database
    Args: data - Dictionary with item fields (name, category, price, etc.)
    Returns: ID of newly created item or None
    """
    query = """
        INSERT INTO menu_items 
        (name, category, description, price, calories, protein, image_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        data.get('name'),
        data.get('category'),
        data.get('description', ''),
        data.get('price'),
        data.get('calories', 0),
        data.get('protein', 0),
        data.get('image_url', '')
    )
    result = execute_query(query, params=params, fetch=False)
    return result  # Returns the new item's ID


# Update existing menu item
def update_item(item_id, data):
    """
    Update an existing menu item
    Args: 
        item_id - ID of item to update
        data - Dictionary with updated fields
    Returns: Number of rows affected (should be 1)
    """
    query = """
        UPDATE menu_items 
        SET name = %s, category = %s, description = %s, 
            price = %s, calories = %s, protein = %s, image_url = %s
        WHERE id = %s
    """
    params = (
        data.get('name'),
        data.get('category'),
        data.get('description', ''),
        data.get('price'),
        data.get('calories', 0),
        data.get('protein', 0),
        data.get('image_url', ''),
        item_id
    )
    result = execute_query(query, params=params, fetch=False)
    return result  # Returns number of rows updated


# Delete menu item
def delete_item(item_id):
    """
    Delete a menu item from database
    Args: item_id - ID of item to delete
    Returns: Number of rows affected (should be 1)
    """
    query = "DELETE FROM menu_items WHERE id = %s"
    result = execute_query(query, params=(item_id,), fetch=False)
    return result


# Toggle availability status
def toggle_availability(item_id):
    """
    Flip the is_available boolean for an item
    Args: item_id - ID of item to toggle
    Returns: Number of rows affected
    """
    query = "UPDATE menu_items SET is_available = NOT is_available WHERE id = %s"
    result = execute_query(query, params=(item_id,), fetch=False)
    return result


# Toggle healthy choice status
def toggle_healthy_choice(item_id):
    """
    Flip the is_healthy_choice boolean for an item
    Args: item_id - ID of item to toggle
    Returns: Number of rows affected
    """
    query = "UPDATE menu_items SET is_healthy_choice = NOT is_healthy_choice WHERE id = %s"
    result = execute_query(query, params=(item_id,), fetch=False)
    return result