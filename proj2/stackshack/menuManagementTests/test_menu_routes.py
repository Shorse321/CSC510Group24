import pytest
from flask import url_for

class TestMenuRoutes:
    """Test menu routes and integration"""

    def test_view_items_requires_login(self, client):
        """Test that viewing items requires login"""
        response = client.get('/menu/items')
        assert response.status_code == 302  # Redirect to login

    def test_view_items_customer_unauthorized(self, client, customer_user):
        """Test customers cannot access menu management"""
        # Login as customer
        client.post('/auth/login', data={
            'username': 'testcustomer',
            'password': 'testpass'
        }, follow_redirects=True)
        
        response = client.get('/menu/items', follow_redirects=True)
        assert b'Unauthorized' in response.data

    def test_view_items_as_admin(self, client, admin_user):
        """Test admin can view menu management page"""
        client.post('/auth/login', data={
            'username': 'testadmin',
            'password': 'testpass'
        })
        
        response = client.get('/menu/items')
        assert response.status_code == 200
        assert b'Menu Management' in response.data

    def test_view_items_with_data(self, client, admin_user, multiple_menu_items):
        """Test viewing menu items shows all items"""
        client.post('/auth/login', data={
            'username': 'testadmin',
            'password': 'testpass'
        })
        
        response = client.get('/menu/items')
        assert b'Sesame Bun' in response.data
        assert b'Beef Patty' in response.data
        assert b'Lettuce' in response.data

    def test_create_item_form_get(self, client, staff_user):
        """Test accessing create item form"""
        client.post('/auth/login', data={
            'username': 'teststaff',
            'password': 'testpass'
        })
        
        response = client.get('/menu/items/new')
        assert response.status_code == 200
        assert b'Add New Menu Item' in response.data

    def test_create_item_post_success(self, client, admin_user):
        """Test creating item via POST request"""
        client.post('/auth/login', data={
            'username': 'testadmin',
            'password': 'testpass'
        })
        
        response = client.post('/menu/items/create', data={
            'name': 'New Test Item',
            'category': 'bun',
            'description': 'Test description',
            'price': '2.99',
            'calories': '200',
            'protein': '6'
        }, follow_redirects=True)
        
        assert response.status_code == 200
        assert b'Item created successfully' in response.data
        assert b'New Test Item' in response.data

    def test_create_item_missing_required_fields(self, client, admin_user):
        """Test creating item without required fields"""
        client.post('/auth/login', data={
            'username': 'testadmin',
            'password': 'testpass'
        })
        
        response = client.post('/menu/items/create', data={
            'name': '',  # Missing name
            'category': 'bun',
            'price': '2.99'
        }, follow_redirects=True)
        
        assert b'required' in response.data.lower()

    def test_edit_item_form_get(self, client, staff_user, sample_menu_item):
        """Test accessing edit form"""
        client.post('/auth/login', data={
            'username': 'teststaff',
            'password': 'testpass'
        })
        
        response = client.get(f'/menu/items/{sample_menu_item.id}/edit')
        assert response.status_code == 200
        assert b'Edit Menu Item' in response.data
        assert b'Test Burger' in response.data

    def test_update_item_post(self, client, admin_user, sample_menu_item):
        """Test updating item via POST"""
        client.post('/auth/login', data={
            'username': 'testadmin',
            'password': 'testpass'
        })
        
        response = client.post(f'/menu/items/{sample_menu_item.id}/update', data={
            'name': 'Updated Burger',
            'category': 'patty',
            'description': 'Updated description',
            'price': '8.99',
            'calories': '350',
            'protein': '28'
        }, follow_redirects=True)
        
        assert response.status_code == 200
        assert b'Item updated successfully' in response.data
        assert b'Updated Burger' in response.data

    def test_delete_item(self, client, admin_user, sample_menu_item):
        """Test deleting an item"""
        client.post('/auth/login', data={
            'username': 'testadmin',
            'password': 'testpass'
        })
        
        response = client.post(f'/menu/items/{sample_menu_item.id}/delete', follow_redirects=True)
        assert response.status_code == 200
        assert b'Item deleted successfully' in response.data

    def test_toggle_availability_route(self, client, staff_user, sample_menu_item):
        """Test toggling availability via route"""
        client.post('/auth/login', data={
            'username': 'teststaff',
            'password': 'testpass'
        })
        
        response = client.post(f'/menu/items/{sample_menu_item.id}/toggle-availability', follow_redirects=True)
        assert response.status_code == 200
        assert b'Availability' in response.data or b'available' in response.data

    def test_toggle_healthy_route(self, client, staff_user, sample_menu_item):
        """Test toggling healthy choice via route"""
        client.post('/auth/login', data={
            'username': 'teststaff',
            'password': 'testpass'
        })
        
        response = client.post(f'/menu/items/{sample_menu_item.id}/toggle-healthy', follow_redirects=True)
        assert response.status_code == 200
    
    def test_create_item_form_customer_unauthorized(self, client, customer_user):
        """Test customers cannot access create form"""
        client.post('/auth/login', data={
            'username': 'testcustomer',
            'password': 'testpass'
        })
        
        response = client.get('/menu/items/new', follow_redirects=True)
        assert b'Unauthorized' in response.data

    def test_edit_item_not_found(self, client, admin_user):
        """Test editing non-existent item"""
        client.post('/auth/login', data={
            'username': 'testadmin',
            'password': 'testpass'
        })
        
        response = client.get('/menu/items/9999/edit', follow_redirects=True)
        assert b'not found' in response.data.lower()

    def test_delete_item_not_found(self, client, admin_user):
        """Test deleting non-existent item"""
        client.post('/auth/login', data={
            'username': 'testadmin',
            'password': 'testpass'
        })
        
        response = client.post('/menu/items/9999/delete', follow_redirects=True)
        assert b'not found' in response.data.lower()