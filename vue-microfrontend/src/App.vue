<template>
  <div class="app">
    <nav class="navbar">
      <div class="nav-container">
        <h1 class="logo">🎵 Music Manager <span class="badge">Info Portal</span></h1>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Главная</router-link>
          <router-link to="/about" class="nav-link">О проекте</router-link>
          <router-link to="/contacts" class="nav-link">Контакты</router-link>
          <a href="http://localhost:5173" class="nav-link main-app">Основное приложение →</a>
        </div>
      </div>
    </nav>
    
    <main>
      <router-view />
    </main>
    
    <footer class="footer">
      <p>© 2025 Music Manager - Микрофронтенд на Vue + SQLite</p>
    </footer>
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
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.navbar {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(168, 85, 247, 0.3);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo {
  color: #a855f7;
  font-size: 1.5rem;
}

.badge {
  font-size: 0.7rem;
  background: rgba(168, 85, 247, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  margin-left: 0.5rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.nav-link {
  color: white;
  text-decoration: none;
  transition: color 0.3s;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.nav-link:hover {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
}

.router-link-active {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
}

.main-app {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
}

.main-app:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #c084fc, #8b5cf6);
}

.footer {
  text-align: center;
  padding: 2rem;
  color: #888;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
}

main {
  min-height: calc(100vh - 140px);
}
</style>