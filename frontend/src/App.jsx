import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import GroupsManagement from './components/GroupsManagement'
import SongsManagement from './components/SongsManagement'
import ToursManagement from './components/ToursManagement'
import Sidebar from './components/Sidebar'
import VueMicrofrontend from './components/VueMicrofrontend'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('userRole')
    if (token && role) {
      setIsAuthenticated(true)
      setUserRole(role)
    }
  }, [])

  const handleLogin = (role) => {
    setIsAuthenticated(true)
    setUserRole(role)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    setIsAuthenticated(false)
    setUserRole(null)
    toast.success('Выход выполнен успешно')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar userRole={userRole} onLogout={handleLogout} />
        <div className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard userRole={userRole} />} />
            <Route path="/groups" element={<GroupsManagement userRole={userRole} />} />
            <Route path="/songs" element={<SongsManagement userRole={userRole} />} />
            <Route path="/tours" element={<ToursManagement userRole={userRole} />} />
            <Route path="*" element={<Navigate to="/" />} />
            <Route path="/info" element={<VueMicrofrontend />} />
          </Routes>
        </div>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          },
        }}
      />
    </Router>
  )
}

export default App