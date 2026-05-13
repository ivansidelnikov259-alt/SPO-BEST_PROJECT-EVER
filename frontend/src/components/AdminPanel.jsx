import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const AdminPanel = () => {
  const iframeRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    // Когда iframe загрузится, отправляем токен в Vue
    const iframe = iframeRef.current
    if (iframe) {
      iframe.onload = () => {
        iframe.contentWindow.postMessage({
          type: 'AUTH_TOKEN',
          token: token
        }, 'http://localhost:5175')
      }
    }
  }, [token])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
      style={{ height: 'calc(100vh - 100px)' }}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-white">Панель администратора</h1>
        <p className="text-purple-300 mt-2">Управление пользователями и мониторинг системы</p>
      </div>
      
      <div className="glass-card p-0 overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
        <iframe
          ref={iframeRef}
          src="http://localhost:5175"
          title="Admin Panel"
          className="w-full h-full"
          style={{
            border: 'none',
            background: 'transparent'
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </motion.div>
  )
}

export default AdminPanel