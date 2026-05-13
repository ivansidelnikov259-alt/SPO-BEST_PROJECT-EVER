import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, Music, Calendar, LogOut, Sparkles, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth()

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Дашборд' },
    { path: '/groups', icon: Users, label: 'Группы' },
    { path: '/songs', icon: Music, label: 'Песни' },
    { path: '/tours', icon: Calendar, label: 'Гастроли' },
  ]

  if (isAdmin) {
    menuItems.push({ path: '/admin', icon: Shield, label: 'Админ-панель' })
  }

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-full w-64 glass-card rounded-none border-l-0 border-t-0 border-b-0 z-20"
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <div className="absolute inset-0 bg-purple-500 rounded-full filter blur-md opacity-50 -z-10"></div>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white">MusicManager</h1>
            <p className="text-xs text-purple-300 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'btn-primary text-white shadow-lg'
                  : 'text-gray-300 hover:bg-white/10'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-300 hover:bg-white/10 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
    </motion.div>
  )
}

export default Sidebar