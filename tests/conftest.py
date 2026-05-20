import pytest
import requests

# Базовые URL микросервисов
AUTH_URL = "http://localhost:8004/api"
GROUPS_URL = "http://localhost:8001"
SONGS_URL = "http://localhost:8002"
TOURS_URL = "http://localhost:8003/api"

# Тестовые пользователи
TEST_ADMIN = {"username": "admin", "password": "admin123"}
TEST_MANAGER = {"username": "baby_manager", "password": "manager123"}

@pytest.fixture
def admin_token():
    """Получаем токен администратора перед тестами"""
    response = requests.post(f"{AUTH_URL}/auth/login", json=TEST_ADMIN)
    assert response.status_code == 200
    return response.json()["token"]

@pytest.fixture
def manager_token():
    """Получаем токен менеджера перед тестами"""
    response = requests.post(f"{AUTH_URL}/auth/login", json=TEST_MANAGER)
    assert response.status_code == 200
    return response.json()["token"]

@pytest.fixture
def headers(admin_token):
    """Заголовки с токеном администратора"""
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def manager_headers(manager_token):
    """Заголовки с токеном менеджера"""
    return {"Authorization": f"Bearer {manager_token}"}