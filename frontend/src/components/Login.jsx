import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Music, Mic, Users, Trophy, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await login(username, password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600 rounded-full filter blur-3xl opacity-10"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Music className="w-16 h-16 text-purple-400 mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-white mt-4">
            Музыкальный Менеджер
          </h1>
          <p className="text-purple-300 mt-2">Управление музыкальными группами</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-dark w-full px-4 py-3 text-white placeholder-gray-400"
              placeholder="Введите имя пользователя"
              required
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark w-full px-4 py-3 text-white placeholder-gray-400"
              placeholder="Введите пароль"
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Войти
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 flex justify-center gap-6 text-gray-500">
          <Mic className="w-5 h-5 hover:text-purple-400 transition-colors" />
          <Users className="w-5 h-5 hover:text-purple-400 transition-colors" />
          <Trophy className="w-5 h-5 hover:text-purple-400 transition-colors" />
        </div>
      </motion.div>
    </div>
  )
}

export default Login