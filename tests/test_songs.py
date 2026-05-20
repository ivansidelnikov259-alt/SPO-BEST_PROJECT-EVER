import pytest
import requests
from .conftest import SONGS_URL

class TestSongs:
    """Тесты микросервиса песен"""
    
    def test_get_songs_admin(self, headers):
        """Админ получает все песни"""
        response = requests.get(f"{SONGS_URL}/songs", headers=headers)
        assert response.status_code == 200
        songs = response.json()
        assert isinstance(songs, list)
        assert len(songs) > 0
    
    def test_get_songs_manager(self, manager_headers):
        """Менеджер видит только свои песни"""
        response = requests.get(f"{SONGS_URL}/songs", headers=manager_headers)
        assert response.status_code == 200
        songs = response.json()
        assert isinstance(songs, list)
        for song in songs:
            if song.get("group_name"):
                assert song["group_name"] == "BABYMETAL"
    
    def test_search_by_composer(self, headers):
        """Поиск песен по композитору KOBAMETAL"""
        response = requests.get(f"{SONGS_URL}/songs/composer/KOBAMETAL", headers=headers)
        assert response.status_code == 200
        songs = response.json()
        assert isinstance(songs, list)
        for song in songs:
            assert song["composer"] == "KOBAMETAL"
    
    def test_search_by_singer(self, headers):
        """Поиск песен по исполнителю SU-METAL"""
        response = requests.get(f"{SONGS_URL}/songs/singer/SU-METAL", headers=headers)
        assert response.status_code == 200
        songs = response.json()
        assert isinstance(songs, list)
        for song in songs:
            assert song["singer"] == "SU-METAL"
    
    def test_unauthorized_access(self):
        """Доступ без токена должен быть запрещён"""
        response = requests.get(f"{SONGS_URL}/songs")
        assert response.status_code == 401
    
    def test_update_song(self, headers):
        """Обновление существующей песни"""
        # Сначала создаём тестовую песню
        groups_resp = requests.get("http://localhost:8001/groups", headers=headers)
        groups = groups_resp.json()
        babyMetal_id = next(g["id"] for g in groups if g["name"] == "BABYMETAL")
        
        new_song = {
            "title": "Song For Update",
            "composer": "Original Composer",
            "lyricist": "Original Lyricist",
            "creation_year": 2023,
            "singer": "Original Singer",
            "group_id": babyMetal_id
        }
        create_resp = requests.post(f"{SONGS_URL}/songs", json=new_song, headers=headers)
        assert create_resp.status_code == 201
        song_id = create_resp.json()["id"]
        
        # Обновляем песню
        updated_song = {
            "title": "Updated Song",
            "composer": "New Composer",
            "lyricist": "New Lyricist",
            "creation_year": 2024,
            "singer": "New Singer",
            "group_id": babyMetal_id
        }
        update_resp = requests.put(f"{SONGS_URL}/songs/{song_id}", json=updated_song, headers=headers)
        assert update_resp.status_code == 200
        song = update_resp.json()
        assert song["title"] == "Updated Song"
        assert song["composer"] == "New Composer"
        
        # Очистка
        requests.delete(f"{SONGS_URL}/songs/{song_id}", headers=headers)
    
    def test_delete_song(self, headers):
        """Удаление песни"""
        # Создаём тестовую песню
        groups_resp = requests.get("http://localhost:8001/groups", headers=headers)
        groups = groups_resp.json()
        babyMetal_id = next(g["id"] for g in groups if g["name"] == "BABYMETAL")
        
        new_song = {
            "title": "Song To Delete",
            "composer": "Delete Composer",
            "lyricist": "Delete Lyricist",
            "creation_year": 2024,
            "singer": "Delete Singer",
            "group_id": babyMetal_id
        }
        create_resp = requests.post(f"{SONGS_URL}/songs", json=new_song, headers=headers)
        assert create_resp.status_code == 201
        song_id = create_resp.json()["id"]
        
        # Удаляем песню
        delete_resp = requests.delete(f"{SONGS_URL}/songs/{song_id}", headers=headers)
        assert delete_resp.status_code == 204
        
        # Проверяем, что песня действительно удалена
        get_resp = requests.get(f"{SONGS_URL}/songs/{song_id}", headers=headers)
        assert get_resp.status_code == 404
    
    def test_get_nonexistent_song(self, headers):
        """Получение несуществующей песни (404)"""
        resp = requests.get(f"{SONGS_URL}/songs/99999", headers=headers)
        assert resp.status_code == 404
    
    def test_search_by_composer_empty(self, headers):
        """Поиск по несуществующему композитору (пустой результат)"""
        resp = requests.get(f"{SONGS_URL}/songs/composer/NonexistentComposer123", headers=headers)
        assert resp.status_code == 200
        songs = resp.json()
        assert isinstance(songs, list)
        assert len(songs) == 0
    
    def test_search_by_singer_empty(self, headers):
        """Поиск по несуществующему исполнителю (пустой результат)"""
        resp = requests.get(f"{SONGS_URL}/songs/singer/NonexistentSinger123", headers=headers)
        assert resp.status_code == 200
        songs = resp.json()
        assert isinstance(songs, list)
        assert len(songs) == 0
    
    def test_create_song_without_group(self, headers):
        """Создание песни без привязки к группе"""
        new_song = {
            "title": "Song Without Group",
            "composer": "Solo Composer",
            "lyricist": "Solo Lyricist",
            "creation_year": 2024,
            "singer": "Solo Singer",
            "group_id": None
        }
        resp = requests.post(f"{SONGS_URL}/songs", json=new_song, headers=headers)
        assert resp.status_code == 201
        song = resp.json()
        assert song["title"] == "Song Without Group"
        assert song["group_id"] is None
        
        # Очистка
        requests.delete(f"{SONGS_URL}/songs/{song['id']}", headers=headers)