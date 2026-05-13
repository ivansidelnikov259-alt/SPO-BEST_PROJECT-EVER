import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import GroupsManagement from './components/GroupsManagement'
import SongsManagement from './components/SongsManagement'
import ToursManagement from './components/ToursManagement'
import AdminPanel from './components/AdminPanel'
import Sidebar from './components/Sidebar'

function AppContent() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} />
      <div className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<Dashboard userRole={user.role} />} />
          <Route path="/groups" element={<GroupsManagement userRole={user.role} />} />
          <Route path="/songs" element={<SongsManagement userRole={user.role} />} />
          <Route path="/tours" element={<ToursManagement userRole={user.role} />} />
          <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  )
}

export default App