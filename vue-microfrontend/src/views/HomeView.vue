<template>
  <div class="home">
    <div class="container">
      <div class="hero">
        <h1 class="hero-title">Добро пожаловать в <span class="gradient">Music Manager</span></h1>
        <p class="hero-subtitle">Информационный портал системы управления музыкальными группами</p>
      </div>

      <div class="card">
        <h2>📢 Последние объявления</h2>
        <div v-if="loading" class="loading">Загрузка...</div>
        <div v-else-if="announcements.length === 0" class="empty">
          <p>Нет объявлений</p>
        </div>
        <div v-else class="announcements">
          <div v-for="item in announcements" :key="item.id" class="announcement">
            <h3>{{ item.title }}</h3>
            <p>{{ item.content }}</p>
            <small>{{ formatDate(item.created_at) }}</small>
          </div>
        </div>

        <!-- Форма добавления (видна только при редактировании через админку) -->
        <div v-if="isAdmin" class="admin-form">
          <h3>Добавить объявление</h3>
          <input v-model="newTitle" placeholder="Заголовок" class="input-field">
          <textarea v-model="newContent" placeholder="Текст объявления" class="input-field"></textarea>
          <button @click="addAnnouncement" class="btn-primary">Добавить</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🎤</div>
          <div class="stat-value">5+</div>
          <div class="stat-label">Музыкальных групп</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎵</div>
          <div class="stat-value">19+</div>
          <div class="stat-label">Песен в репертуаре</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚀</div>
          <div class="stat-value">7+</div>
          <div class="stat-label">Гастрольных туров</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'HomeView',
  data() {
    return {
      announcements: [],
      loading: true,
      isAdmin: false,
      newTitle: '',
      newContent: ''
    }
  },
  mounted() {
    this.fetchAnnouncements()
    // Для демо - можно добавить Admin Mode через localStorage
    this.isAdmin = localStorage.getItem('vue_admin_mode') === 'true'
  },
  methods: {
    async fetchAnnouncements() {
      try {
        const response = await axios.get('/api/announcements')
        this.announcements = response.data
      } catch (error) {
        console.error('Ошибка загрузки объявлений:', error)
      } finally {
        this.loading = false
      }
    },
    async addAnnouncement() {
      if (!this.newTitle || !this.newContent) return
      try {
        await axios.post('/api/announcements', {
          title: this.newTitle,
          content: this.newContent
        })
        this.newTitle = ''
        this.newContent = ''
        this.fetchAnnouncements()
      } catch (error) {
        console.error('Ошибка добавления:', error)
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU')
    }
  }
}
</script>

<style scoped>
.home {
  padding: 2rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 2.5rem;
  color: white;
  margin-bottom: 1rem;
}

.gradient {
  background: linear-gradient(135deg, #a855f7, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  color: #aaa;
  font-size: 1.1rem;
}

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.card h2 {
  color: white;
  margin-bottom: 1rem;
}

.announcement {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.announcement h3 {
  color: #a855f7;
  margin-bottom: 0.5rem;
}

.announcement p {
  color: #ccc;
  margin-bottom: 0.5rem;
}

.announcement small {
  color: #888;
  font-size: 0.8rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #a855f7;
}

.stat-label {
  color: #aaa;
  font-size: 0.9rem;
}

.admin-form {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-form h3 {
  color: white;
  margin-bottom: 1rem;
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

.loading, .empty {
  text-align: center;
  color: #aaa;
  padding: 2rem;
}
</style>