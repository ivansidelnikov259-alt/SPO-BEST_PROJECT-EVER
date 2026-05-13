<template>
  <div class="app">
    <router-view />
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
  background: transparent;
  font-family: 'Inter', system-ui, sans-serif;
}

::-webkit-scrollbar {
  width: 8px;
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
</style>