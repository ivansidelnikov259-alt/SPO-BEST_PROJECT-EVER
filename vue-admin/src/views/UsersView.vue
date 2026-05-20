<template>
  <div class="users">
    <div class="header">
      <h2>👥 Управление пользователями</h2>
      <button @click="showCreateForm = !showCreateForm" class="btn-create">
        <span>➕</span> Создать пользователя
      </button>
    </div>

    <!-- Форма создания пользователя -->
    <div v-if="showCreateForm" class="create-form">
      <h3>Новый пользователь</h3>
      <div class="form-row">
        <input v-model="newUser.username" placeholder="Имя пользователя" class="input" />
        <input v-model="newUser.password" type="password" placeholder="Пароль" class="input" />
        <select v-model="newUser.role" class="select">
          <option value="manager">Менеджер</option>
          <option value="admin">Администратор</option>
        </select>
        <button @click="createUser" class="btn-save">Создать</button>
        <button @click="showCreateForm = false" class="btn-cancel">Отмена</button>
      </div>
    </div>

    <!-- Список пользователей -->
    <div class="users-list">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="user-avatar">
          <span>{{ user.username.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="user-info">
          <div class="user-name">{{ user.username }}</div>
          <div class="user-meta">
            <span :class="['role-badge', user.role === 'admin' ? 'admin' : 'manager']">
              {{ user.role === 'admin' ? 'Администратор' : 'Менеджер' }}
            </span>
            <span :class="['status-badge', user.is_active ? 'active' : 'blocked']">
              {{ user.is_active ? 'Активен' : 'Заблокирован' }}
            </span>
          </div>
          <div class="user-date">Создан: {{ formatDate(user.created_at) }}</div>
        </div>
        <div class="user-actions">
          <!-- Кнопка смены пароля -->
          <button @click="openPasswordModal(user)" class="action-btn password">
            🔑 Сменить пароль
          </button>
          <select @change="updateRole(user.id, $event.target.value)" :value="user.role" class="role-select">
            <option value="manager">Менеджер</option>
            <option value="admin">Админ</option>
          </select>
          <button @click="toggleStatus(user.id, !user.is_active)" class="action-btn" :class="user.is_active ? 'block' : 'unblock'">
            {{ user.is_active ? '🔒 Заблокировать' : '🔓 Разблокировать' }}
          </button>
          <button @click="deleteUser(user.id, user.username)" class="action-btn delete">
            🗑️ Удалить
          </button>
        </div>
      </div>

      <div v-if="users.length === 0" class="empty">
        <p>Нет пользователей</p>
      </div>
    </div>

    <!-- Модальное окно для смены пароля -->
    <div v-if="showPasswordModal" class="modal" @click="closePasswordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Смена пароля для: {{ selectedUser?.username }}</h3>
          <button class="modal-close" @click="closePasswordModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Новый пароль</label>
            <input 
              v-model="newPassword" 
              type="password" 
              placeholder="Введите новый пароль"
              class="input"
            />
          </div>
          <div class="form-group">
            <label>Подтверждение пароля</label>
            <input 
              v-model="confirmPassword" 
              type="password" 
              placeholder="Подтвердите пароль"
              class="input"
              @keyup.enter="changePassword"
            />
          </div>
          <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</div>
        </div>
        <div class="modal-footer">
          <button @click="resetPassword" class="btn-reset" :disabled="resetLoading">
            {{ resetLoading ? 'Сброс...' : '🔄 Сбросить пароль' }}
          </button>
          <button @click="changePassword" class="btn-save" :disabled="changeLoading">
            {{ changeLoading ? 'Сохранение...' : '💾 Сохранить пароль' }}
          </button>
          <button @click="closePasswordModal" class="btn-cancel">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'UsersView',
  data() {
    return {
      users: [],
      showCreateForm: false,
      showPasswordModal: false,
      selectedUser: null,
      newPassword: '',
      confirmPassword: '',
      passwordError: '',
      passwordSuccess: '',
      changeLoading: false,
      resetLoading: false,
      newUser: {
        username: '',
        password: '',
        role: 'manager'
      }
    }
  },
  mounted() {
    this.fetchUsers()
  },
  methods: {
    getToken() {
      return localStorage.getItem('admin_token')
    },
    async fetchUsers() {
      const token = this.getToken()
      if (!token) {
        this.$router.push('/login')
        return
      }
      
      try {
        const response = await axios.get('http://localhost:8004/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.users = response.data
      } catch (error) {
        console.error('Error fetching users:', error)
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token')
          this.$router.push('/login')
        }
      }
    },
    async createUser() {
      if (!this.newUser.username || !this.newUser.password) {
        alert('Заполните все поля')
        return
      }
      
      const token = this.getToken()
      try {
        await axios.post('http://localhost:8004/api/users', this.newUser, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.newUser = { username: '', password: '', role: 'manager' }
        this.showCreateForm = false
        this.fetchUsers()
      } catch (error) {
        alert(error.response?.data?.error || 'Ошибка создания')
      }
    },
    async updateRole(userId, role) {
      const token = this.getToken()
      const user = this.users.find(u => u.id === userId)
      try {
        await axios.put(`http://localhost:8004/api/users/${userId}`, 
          { role, is_active: user.is_active },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.fetchUsers()
      } catch (error) {
        console.error('Error updating role:', error)
      }
    },
    async toggleStatus(userId, isActive) {
      const token = this.getToken()
      const user = this.users.find(u => u.id === userId)
      try {
        await axios.put(`http://localhost:8004/api/users/${userId}`,
          { role: user.role, is_active: isActive },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.fetchUsers()
      } catch (error) {
        console.error('Error toggling status:', error)
      }
    },
    async deleteUser(userId, username) {
      if (confirm(`Удалить пользователя "${username}"?`)) {
        const token = this.getToken()
        try {
          await axios.delete(`http://localhost:8004/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          this.fetchUsers()
        } catch (error) {
          console.error('Error deleting user:', error)
        }
      }
    },
    openPasswordModal(user) {
      this.selectedUser = user
      this.newPassword = ''
      this.confirmPassword = ''
      this.passwordError = ''
      this.passwordSuccess = ''
      this.showPasswordModal = true
    },
    closePasswordModal() {
      this.showPasswordModal = false
      this.selectedUser = null
      this.newPassword = ''
      this.confirmPassword = ''
      this.passwordError = ''
      this.passwordSuccess = ''
    },
    async changePassword() {
      if (!this.newPassword) {
        this.passwordError = 'Введите новый пароль'
        return
      }
      if (this.newPassword.length < 4) {
        this.passwordError = 'Пароль должен содержать минимум 4 символа'
        return
      }
      if (this.newPassword !== this.confirmPassword) {
        this.passwordError = 'Пароли не совпадают'
        return
      }
      
      this.changeLoading = true
      this.passwordError = ''
      this.passwordSuccess = ''
      
      const token = this.getToken()
      try {
        await axios.put(`http://localhost:8004/api/users/${this.selectedUser.id}/password`, 
          { new_password: this.newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.passwordSuccess = 'Пароль успешно изменён'
        setTimeout(() => {
          this.closePasswordModal()
        }, 1500)
      } catch (error) {
        this.passwordError = error.response?.data?.error || 'Ошибка смены пароля'
      } finally {
        this.changeLoading = false
      }
    },
    async resetPassword() {
      if (!confirm(`Сбросить пароль для пользователя "${this.selectedUser.username}"? Новый пароль будет сгенерирован автоматически.`)) {
        return
      }
      
      this.resetLoading = true
      this.passwordError = ''
      this.passwordSuccess = ''
      
      const token = this.getToken()
      try {
        const response = await axios.post(`http://localhost:8004/api/users/${this.selectedUser.id}/reset-password`, 
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.passwordSuccess = `Новый пароль: ${response.data.new_password}`
        setTimeout(() => {
          this.closePasswordModal()
        }, 3000)
      } catch (error) {
        this.passwordError = error.response?.data?.error || 'Ошибка сброса пароля'
      } finally {
        this.resetLoading = false
      }
    },
    formatDate(date) {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('ru-RU')
    }
  }
}
</script>

<style scoped>
.users {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header h2 {
  color: white;
  font-size: 1.2rem;
  margin: 0;
}

.btn-create {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-form {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.create-form h3 {
  color: white;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.form-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.input, .select {
  flex: 1;
  min-width: 120px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
}

.btn-save, .btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  cursor: pointer;
}

.btn-save {
  background: #22c55e;
  border: none;
  color: white;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  flex-wrap: wrap;
}

.user-avatar {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.user-info {
  flex: 1;
}

.user-name {
  color: white;
  font-weight: 500;
}

.user-meta {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.role-badge, .status-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
}

.role-badge.admin {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.role-badge.manager {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.status-badge.blocked {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.user-date {
  font-size: 0.7rem;
  color: #666;
  margin-top: 0.25rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.75rem;
  border: none;
}

.action-btn.password {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.action-btn.block {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.action-btn.unblock {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.role-select {
  padding: 0.35rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
}

/* Модальное окно */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 24px;
  width: 90%;
  max-width: 450px;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: white;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  color: #aaa;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
}

.error-message {
  color: #f87171;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.success-message {
  color: #4ade80;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: flex-end;
}

.btn-reset {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>