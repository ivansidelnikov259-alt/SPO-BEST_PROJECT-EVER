<template>
  <div class="app">
    <nav class="navbar">
      <div class="nav-container">
        <h1 class="logo">🎵 Vue Admin Panel</h1>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Статистика</router-link>
          <router-link to="/users" class="nav-link">Пользователи</router-link>
          <router-link to="/logs" class="nav-link">Логи</router-link>
          <a href="http://localhost:5173" class="nav-link main">← Основное приложение</a>
        </div>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  font-family: 'Inter', system-ui, sans-serif;
}

.navbar {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(168, 85, 247, 0.3);
  padding: 1rem 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  color: #a855f7;
  font-size: 1.5rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.nav-link:hover {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
}

.router-link-active {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
}

.main {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
}

main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>