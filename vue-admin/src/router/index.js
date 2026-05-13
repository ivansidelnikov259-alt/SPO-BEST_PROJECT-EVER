import { createRouter, createWebHistory } from 'vue-router'
import AdminLogin from '../views/AdminLogin.vue'
import Dashboard from '../views/Dashboard.vue'
import UsersView from '../views/UsersView.vue'
import LogsView from '../views/LogsView.vue'

const routes = [
  { path: '/login', name: 'login', component: AdminLogin },
  { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/users', name: 'users', component: UsersView, meta: { requiresAuth: true } },
  { path: '/logs', name: 'logs', component: LogsView, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router