<template>
  <div class="about">
    <div class="container">
      <div class="card">
        <h1>{{ about.title || 'Music Manager' }}</h1>
        <div class="version">Версия: {{ about.version || '1.0.0' }}</div>
        <div class="content">
          <p>{{ about.content || 'Система для управления музыкальными группами.' }}</p>
        </div>
      </div>

      <div class="card">
        <h2>Архитектура проекта</h2>
        <div class="arch-info">
          <div class="arch-item">
            <h3>🖥️ Основное приложение (React)</h3>
            <p>Управление группами, песнями и гастролями. Работает с PostgreSQL.</p>
          </div>
          <div class="arch-item">
            <h3>📱 Микрофронтенд (Vue + SQLite)</h3>
            <p>Информационный портал. Контакты, новости, описание проекта.</p>
          </div>
          <div class="arch-item">
            <h3>⚙️ Микросервисы</h3>
            <p>Python (группы) | Node.js (песни) | Go (гастроли)</p>
          </div>
        </div>
      </div>

      <div v-if="isAdmin" class="card admin-card">
        <h2>✏️ Редактирование информации</h2>
        <input v-model="editForm.title" placeholder="Заголовок" class="input-field">
        <textarea v-model="editForm.content" placeholder="Содержание" class="input-field" rows="4"></textarea>
        <input v-model="editForm.version" placeholder="Версия" class="input-field">
        <button @click="updateAbout" class="btn-primary">Сохранить изменения</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AboutView',
  data() {
    return {
      about: {},
      editForm: {
        title: '',
        content: '',
        version: ''
      },
      isAdmin: false
    }
  },
  mounted() {
    this.fetchAbout()
    this.isAdmin = localStorage.getItem('vue_admin_mode') === 'true'
  },
  methods: {
    async fetchAbout() {
      try {
        const response = await axios.get('/api/about')
        this.about = response.data
        this.editForm = { ...response.data }
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      }
    },
    async updateAbout() {
      try {
        await axios.put('/api/about', this.editForm)
        this.fetchAbout()
      } catch (error) {
        console.error('Ошибка обновления:', error)
      }
    }
  }
}
</script>

<style scoped>
.about {
  padding: 2rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card h1 {
  color: #a855f7;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.version {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.content p {
  color: #ccc;
  line-height: 1.6;
}

.card h2 {
  color: white;
  margin-bottom: 1rem;
}

.arch-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.arch-item h3 {
  color: #a855f7;
  margin-bottom: 0.5rem;
}

.arch-item p {
  color: #ccc;
}

.admin-card {
  border-color: #a855f7;
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
}
</style>