import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      const response = await axios.post('http://localhost:8004/api/auth/verify', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.valid) {
        setUser(response.data.user)
        localStorage.setItem('userRole', response.data.user.role)
        localStorage.setItem('userId', response.data.user.id)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        localStorage.removeItem('userId')
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:8004/api/auth/login', {
        username, password
      })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('userRole', user.role)
      localStorage.setItem('userId', user.id)
      setUser(user)
      toast.success(`Добро пожаловать, ${user.username}!`)
      return true
    } catch (error) {
      toast.error(error.response?.data?.error || 'Ошибка входа')
      return false
    }
  }

  const logout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await axios.post('http://localhost:8004/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    setUser(null)
    toast.success('Выход выполнен')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAdmin: user?.role === 'admin',
      userId: user?.id
    }}>
      {children}
    </AuthContext.Provider>
  )
}