<template>
  <div class="assign-manager">
    <h1 class="title">👥 Управление привязкой менеджеров к группам</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🎤</div>
        <div class="stat-value">{{ groups.length }}</div>
        <div class="stat-label">Всего групп</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍💼</div>
        <div class="stat-value">{{ managers.length }}</div>
        <div class="stat-label">Менеджеров</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔗</div>
        <div class="stat-value">{{ assignedCount }}</div>
        <div class="stat-label">Назначений</div>
      </div>
    </div>

    <div class="card">
      <h2>📋 Назначить менеджера группе</h2>
      <div class="assign-form">
        <select v-model="selectedGroupId" class="select">
          <option value="">Выберите группу</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }} (текущий: {{ getManagerName(group.created_by) || 'не назначен' }})
          </option>
        </select>
        
        <select v-model="selectedManagerId" class="select">
          <option value="">Выберите менеджера</option>
          <option v-for="manager in managers" :key="manager.id" :value="manager.id">
            {{ manager.username }}
          </option>
        </select>
        
        <button @click="assignManager" class="btn-primary" :disabled="!selectedGroupId || !selectedManagerId">
          Назначить
        </button>
      </div>
    </div>

    <div class="card">
      <h2>📊 Текущие привязки</h2>
      <div class="assignments-list">
        <div v-for="group in groups" :key="group.id" class="assignment-item">
          <div class="group-info">
            <strong>{{ group.name }}</strong>
            <span class="group-id">ID: {{ group.id }}</span>
          </div>
          <div class="manager-info">
            <span class="label">Менеджер:</span>
            <span class="manager-name">{{ getManagerName(group.created_by) || '❌ не назначен' }}</span>
          </div>
          <div class="actions">
            <select v-model="group.created_by" @change="updateManager(group.id, group.created_by)" class="small-select">
              <option :value="null">Не назначен</option>
              <option v-for="manager in managers" :key="manager.id" :value="manager.id">
                {{ manager.username }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AssignManager',
  data() {
    return {
      groups: [],
      managers: [],
      selectedGroupId: '',
      selectedManagerId: ''
    }
  },
  computed: {
    assignedCount() {
      return this.groups.filter(g => g.created_by).length
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    getToken() {
      return localStorage.getItem('admin_token')
    },
    getManagerName(managerId) {
      const manager = this.managers.find(m => m.id === managerId)
      return manager ? manager.username : null
    },
    async fetchData() {
      const token = this.getToken()
      if (!token) {
        this.$router.push('/login')
        return
      }
      
      try {
        const [groupsRes, managersRes] = await Promise.all([
          axios.get('http://localhost:8001/groups', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8004/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        this.groups = groupsRes.data
        this.managers = managersRes.data.filter(u => u.role === 'manager')
      } catch (error) {
        console.error('Error fetching data:', error)
        if (error.response?.status === 401) {
          this.$router.push('/login')
        }
      }
    },
    async assignManager() {
      const token = this.getToken()
      try {
        await axios.put(`http://localhost:8001/groups/${this.selectedGroupId}/assign-manager`, null, {
          params: { manager_id: this.selectedManagerId },
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('Менеджер назначен успешно!')
        this.fetchData()
        this.selectedGroupId = ''
        this.selectedManagerId = ''
      } catch (error) {
        console.error('Error assigning manager:', error)
        alert(error.response?.data?.detail || 'Ошибка назначения')
      }
    },
    async updateManager(groupId, managerId) {
      const token = this.getToken()
      try {
        await axios.put(`http://localhost:8001/groups/${groupId}/assign-manager`, null, {
          params: { manager_id: managerId },
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('Изменения сохранены!')
        this.fetchData()
      } catch (error) {
        console.error('Error updating manager:', error)
        alert('Ошибка сохранения')
        this.fetchData()
      }
    }
  }
}
</script>

<style scoped>
.assign-manager {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.title {
  font-size: 1.8rem;
  color: white;
  margin-bottom: 1.5rem;
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
  padding: 1rem;
  text-align: center;
}

.stat-icon {
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #a855f7;
}

.stat-label {
  color: #aaa;
  font-size: 0.8rem;
}

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card h2 {
  color: white;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.assign-form {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.select {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  cursor: pointer;
}

.select option {
  background: #1a1a2e;
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(168, 85, 247, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 1rem;
}

.group-info {
  min-width: 150px;
}

.group-info strong {
  color: white;
  display: block;
}

.group-id {
  color: #666;
  font-size: 0.7rem;
}

.manager-info {
  flex: 1;
}

.label {
  color: #888;
  font-size: 0.8rem;
}

.manager-name {
  color: #a855f7;
  margin-left: 0.5rem;
}

.small-select {
  padding: 0.35rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.small-select option {
  background: #1a1a2e;
  color: white;
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
</style>