<template>
  <div class="app">
    <nav class="navbar">
      <div class="nav-container">
        <div class="logo">
          <span class="logo-icon">🎵</span>
          <span class="logo-text">Admin Panel</span>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">
            <span class="nav-icon">📊</span>
            <span>Статистика</span>
          </router-link>
          <router-link to="/users" class="nav-link">
            <span class="nav-icon">👥</span>
            <span>Пользователи</span>
          </router-link>
          <router-link to="/logs" class="nav-link">
            <span class="nav-icon">📋</span>
            <span>Логи</span>
          </router-link>
          <router-link to="/assign" class="nav-link">
            <span class="nav-icon">🔗</span>
            <span>Привязка групп</span>
          </router-link>
        </div>
        <div class="user-info">
          <span class="admin-badge">Администратор</span>
          <button @click="logout" class="logout-btn">Выйти</button>
        </div>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    // Слушаем сообщение от React с токеном
    window.addEventListener('message', (event) => {
      if (event.origin !== 'http://localhost:5173') return
      
      if (event.data.type === 'AUTH_TOKEN' && event.data.token) {
        localStorage.setItem('admin_token', event.data.token)
        
        // Если мы на странице логина, перенаправляем на дашборд
        if (this.$route.path === '/login') {
          this.$router.push('/')
        }
      }
    })
  },
  methods: {
    logout() {
      localStorage.removeItem('admin_token')
      this.$router.push('/login')
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.navbar {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-text {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a855f7, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 12px;
  color: #aaa;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-icon {
  font-size: 1.1rem;
}

.nav-link:hover {
  color: white;
  background: rgba(168, 85, 247, 0.15);
}

.router-link-active {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-badge {
  background: rgba(168, 85, 247, 0.2);
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #a855f7;
  font-weight: 500;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.4rem 1rem;
  border-radius: 10px;
  color: #ff6b6b;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
}

main {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #a855f7;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #c084fc;
}

/* Анимации */
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

.fade-enter-active {
  animation: fadeIn 0.3s ease-out;
}
</style>