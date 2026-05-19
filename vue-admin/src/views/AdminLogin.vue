<template>
  <div class="login">
    <div class="login-card">
      <div class="logo">
        <div class="logo-icon">🎵</div>
        <h1>Admin Panel</h1>
        <p>Вход в панель управления</p>
      </div>
      
      <div class="input-group">
        <input 
          v-model="username" 
          type="text" 
          placeholder="Имя пользователя"
          @keyup.enter="login"
          class="input-field"
        />
      </div>
      
      <div class="input-group">
        <input 
          v-model="password" 
          type="password" 
          placeholder="Пароль"
          @keyup.enter="login"
          class="input-field"
        />
      </div>
      
      <button @click="login" :disabled="loading" class="login-btn">
        <span v-if="loading" class="spinner"></span>
        <span v-else>{{ 'Войти' }}</span>
      </button>
      
      <p v-if="error" class="error-message">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AdminLogin',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: ''
    }
  },
  mounted() {
    const token = localStorage.getItem('admin_token')
    if (token) {
      this.autoLogin(token)
    }
  },
  methods: {
    async autoLogin(token) {
      try {
        const response = await axios.post('http://localhost:8004/api/auth/verify', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data.valid && response.data.user.role === 'admin') {
          this.$router.push('/')
        }
      } catch (err) {
        localStorage.removeItem('admin_token')
      }
    },
    async login() {
      if (!this.username || !this.password) {
        this.error = 'Заполните все поля'
        return
      }
      
      this.loading = true
      this.error = ''
      
      try {
        const response = await axios.post('http://localhost:8004/api/auth/login', {
          username: this.username,
          password: this.password
        })
        
        if (response.data.user.role === 'admin') {
          localStorage.setItem('admin_token', response.data.token)
          this.$router.push('/')
        } else {
          this.error = 'Доступ только для администраторов'
        }
      } catch (err) {
        this.error = 'Неверное имя пользователя или пароль'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%);
  padding: 1rem;
}

.login-card {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  padding: 2.5rem;
  border-radius: 32px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.logo {
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
}

.login-card h1 {
  background: linear-gradient(135deg, #a855f7, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.login-card p {
  color: #888;
  font-size: 0.85rem;
}

.input-group {
  margin-bottom: 1rem;
}

.input-field {
  width: 100%;
  padding: 0.9rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #a855f7;
  background: rgba(255, 255, 255, 0.12);
}

.input-field::placeholder {
  color: #666;
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: white;
  border: none;
  padding: 0.9rem;
  border-radius: 16px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  margin-top: 0.5rem;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.4);
}

.login-btn:disabled {
  opacity: 0.7;
  transform: none;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #f87171;
  margin-top: 1rem;
  font-size: 0.85rem;
}
</style>