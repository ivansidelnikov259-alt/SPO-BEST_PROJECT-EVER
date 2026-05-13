<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">{{ stats.users }}</div>
        <div class="stat-label">Всего пользователей</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👑</div>
        <div class="stat-value">{{ stats.admins }}</div>
        <div class="stat-label">Администраторов</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-value">{{ stats.logs }}</div>
        <div class="stat-label">Всего действий</div>
      </div>
    </div>

    <div class="nav-buttons">
      <router-link to="/users" class="nav-btn">
        <span class="nav-icon">👥</span>
        <div class="nav-content">
          <h3>Управление пользователями</h3>
          <p>Создание, редактирование и блокировка</p>
        </div>
      </router-link>
      
      <router-link to="/logs" class="nav-btn">
        <span class="nav-icon">📋</span>
        <div class="nav-content">
          <h3>Журнал действий</h3>
          <p>Просмотр истории операций</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Dashboard',
  data() {
    return {
      stats: {
        users: 0,
        admins: 0,
        logs: 0
      }
    }
  },
  mounted() {
    this.fetchStats()
  },
  methods: {
    getToken() {
      return localStorage.getItem('admin_token')
    },
    async fetchStats() {
      const token = this.getToken()
      if (!token) return
      
      try {
        const [usersRes, logsRes] = await Promise.all([
          axios.get('http://localhost:8004/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8004/api/logs', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        
        this.stats.users = usersRes.data?.length || 0
        this.stats.admins = usersRes.data?.filter(u => u.role === 'admin').length || 0
        this.stats.logs = logsRes.data?.length || 0
      } catch (error) {
        console.error('Error fetching stats:', error)
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token')
          this.$router.push('/login')
        }
      }
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.25rem;
  text-align: center;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: #a855f7;
}

.stat-label {
  color: #aaa;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.nav-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(168, 85, 247, 0.08);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 16px;
  color: white;
  text-decoration: none;
  transition: all 0.3s;
}

.nav-btn:hover {
  background: rgba(168, 85, 247, 0.15);
  transform: translateY(-2px);
}

.nav-icon {
  font-size: 2rem;
}

.nav-content h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.nav-content p {
  font-size: 0.8rem;
  color: #888;
}
</style>