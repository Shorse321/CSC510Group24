import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),      # localhost
            user=os.getenv('DB_USER'),      # root
            password=os.getenv('DB_PASSWORD'),  # your password
            database=os.getenv('DB_NAME')   # stackshack
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None
      
def execute_query(query, params=None, fetch=True):
    """Execute a query and return results"""
    connection = get_db_connection()
    if connection is None:
        return None
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params or ())
        
        if fetch:
            result = cursor.fetchall()      # For SELECT queries
        else:
            connection.commit()             # For INSERT/UPDATE/DELETE
            result = cursor.lastrowid if cursor.lastrowid else cursor.rowcount
        
        cursor.close()
        return result
    except Error as e:
        print(f"Error executing query: {e}")
        return None
    finally:
        if connection.is_connected():
            connection.close()