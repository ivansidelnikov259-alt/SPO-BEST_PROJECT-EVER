<template>
  <div class="logs">
    <div class="header">
      <h2>📋 Журнал действий</h2>
      <button @click="refreshLogs" class="btn-refresh">
        🔄 Обновить
      </button>
    </div>

    <div class="logs-list">
      <div v-for="log in logs" :key="log.id" class="log-item">
        <div class="log-header">
          <span class="user-icon">👤</span>
          <span class="username">{{ log.username }}</span>
          <span class="time">{{ formatDate(log.created_at) }}</span>
        </div>
        <div class="log-body">
          <span class="action">{{ log.action }}</span>
          <span class="details">{{ log.details }}</span>
        </div>
      </div>

      <div v-if="logs.length === 0" class="empty">
        <p>Нет записей в журнале</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'LogsView',
  data() {
    return {
      logs: []
    }
  },
  mounted() {
    this.fetchLogs()
  },
  methods: {
    getToken() {
      return localStorage.getItem('admin_token')
    },
    async fetchLogs() {
      try {
        const token = this.getToken()
        const response = await axios.get('/api/logs', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.logs = response.data
      } catch (error) {
        console.error('Error fetching logs:', error)
      }
    },
    refreshLogs() {
      this.fetchLogs()
    },
    formatDate(date) {
      return new Date(date).toLocaleString('ru-RU')
    }
  }
}
</script>

<style scoped>
.logs {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header h2 {
  color: white;
  font-size: 1.25rem;
  margin: 0;
}

.btn-refresh {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.4rem 1rem;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.btn-refresh:hover {
  background: rgba(255, 255, 255, 0.15);
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.log-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 0.75rem;
  border-left: 3px solid #a855f7;
  transition: all 0.3s;
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.log-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.user-icon {
  font-size: 0.8rem;
}

.username {
  color: #a855f7;
  font-weight: 500;
  font-size: 0.85rem;
}

.time {
  color: #666;
  font-size: 0.7rem;
}

.log-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action {
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
}

.details {
  color: #888;
  font-size: 0.75rem;
}

.empty {
  text-align: center;
  color: #666;
  padding: 2rem;
}
</style>