import pytest
import requests
from .conftest import AUTH_URL, TEST_ADMIN, TEST_MANAGER

class TestAuth:
    """Тесты авторизации"""
    
    def test_login_admin_success(self):
        """Успешный вход администратора"""
        response = requests.post(f"{AUTH_URL}/auth/login", json=TEST_ADMIN)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["username"] == "admin"
    
    def test_login_manager_success(self):
        """Успешный вход менеджера"""
        response = requests.post(f"{AUTH_URL}/auth/login", json=TEST_MANAGER)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "manager"
        assert data["user"]["username"] == "baby_manager"
    
    def test_login_wrong_password(self):
        """Вход с неверным паролем"""
        response = requests.post(f"{AUTH_URL}/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_login_wrong_username(self):
        """Вход с неверным логином"""
        response = requests.post(f"{AUTH_URL}/auth/login", json={
            "username": "nonexistent",
            "password": "admin123"
        })
        assert response.status_code == 401
    
    def test_verify_token_success(self, admin_token):
        """Проверка валидного токена"""
        response = requests.post(f"{AUTH_URL}/auth/verify", 
                                 headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        assert response.json()["valid"] == True
    
    def test_verify_token_invalid(self):
        """Проверка невалидного токена"""
        response = requests.post(f"{AUTH_URL}/auth/verify", 
                                 headers={"Authorization": "Bearer invalid.token.here"})
        assert response.status_code == 401
    
    def test_logout_success(self, admin_token):
        """Успешный выход из системы"""
        response = requests.post(f"{AUTH_URL}/auth/logout", 
                                 headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        # После выхода токен должен стать невалидным
        verify_response = requests.post(f"{AUTH_URL}/auth/verify", 
                                         headers={"Authorization": f"Bearer {admin_token}"})
        assert verify_response.status_code == 401
        # Получаем новый токен для остальных тестов
        new_response = requests.post(f"{AUTH_URL}/auth/login", json=TEST_ADMIN)
        assert new_response.status_code == 200
    
    def test_access_without_token(self):
        """Доступ к защищённому ресурсу без токена"""
        response = requests.get(f"{AUTH_URL}/users")
        assert response.status_code == 401