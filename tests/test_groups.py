import pytest
import requests
from .conftest import GROUPS_URL

class TestGroups:
    """Тесты микросервиса групп"""
    
    def test_get_groups_admin(self, headers):
        """Админ получает все группы"""
        response = requests.get(f"{GROUPS_URL}/groups", headers=headers)
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        assert len(groups) >= 5
    
    def test_get_groups_manager(self, manager_headers):
        """Менеджер видит только свои группы"""
        response = requests.get(f"{GROUPS_URL}/groups", headers=manager_headers)
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        for group in groups:
            assert group["name"] == "BABYMETAL"
    
    def test_create_group(self, headers):
        """Создание новой группы (админ)"""
        new_group = {
            "name": "Test Group",
            "formation_year": 2024,
            "country": "Russia",
            "rating": 80,
            "description": "Test description"
        }
        response = requests.post(f"{GROUPS_URL}/groups", json=new_group, headers=headers)
        assert response.status_code == 201
        group = response.json()
        assert group["name"] == "Test Group"
        
        # Очистка: удаляем тестовую группу
        requests.delete(f"{GROUPS_URL}/groups/{group['id']}", headers=headers)
    
    def test_get_popular_top(self):
        """Получение самой популярной группы"""
        response = requests.get(f"{GROUPS_URL}/groups/popular/top")
        assert response.status_code == 200
        group = response.json()
        assert "name" in group
        assert "rating" in group
    
    def test_update_group(self, headers):
        """Обновление существующей группы"""
        # Сначала создаём тестовую группу
        new_group = {
            "name": "Group For Update",
            "formation_year": 2023,
            "country": "Testland",
            "rating": 70,
            "description": "Original description"
        }
        create_resp = requests.post(f"{GROUPS_URL}/groups", json=new_group, headers=headers)
        assert create_resp.status_code == 201
        group_id = create_resp.json()["id"]
        
        # Обновляем группу
        updated_group = {
            "name": "Updated Group",
            "formation_year": 2024,
            "country": "Updatedland",
            "rating": 90,
            "description": "Updated description"
        }
        update_resp = requests.put(f"{GROUPS_URL}/groups/{group_id}", json=updated_group, headers=headers)
        assert update_resp.status_code == 200
        group = update_resp.json()
        assert group["name"] == "Updated Group"
        assert group["rating"] == 90
        
        # Очистка
        requests.delete(f"{GROUPS_URL}/groups/{group_id}", headers=headers)
    
    def test_get_group_by_id(self, headers):
        """Получение группы по ID"""
        # Получаем список групп
        resp = requests.get(f"{GROUPS_URL}/groups", headers=headers)
        groups = resp.json()
        if groups:
            group_id = groups[0]["id"]
            get_resp = requests.get(f"{GROUPS_URL}/groups/{group_id}", headers=headers)
            assert get_resp.status_code == 200
            group = get_resp.json()
            assert group["id"] == group_id
            assert "name" in group
            assert "rating" in group
    
    def test_get_nonexistent_group(self, headers):
        """Получение несуществующей группы (404)"""
        resp = requests.get(f"{GROUPS_URL}/groups/99999", headers=headers)
        assert resp.status_code == 404
    
    def test_create_group_without_auth(self):
        """Создание группы без авторизации (должно быть запрещено)"""
        new_group = {
            "name": "Unauthorized Group",
            "formation_year": 2024,
            "country": "Nowhere",
            "rating": 50,
            "description": "Should not be created"
        }
        resp = requests.post(f"{GROUPS_URL}/groups", json=new_group)
        assert resp.status_code == 401