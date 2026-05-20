import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import Sidebar from './components/Sidebar'

// Ленивая загрузка компонентов
const Dashboard = lazy(() => import('./components/Dashboard'))
const GroupsManagement = lazy(() => import('./components/GroupsManagement'))
const SongsManagement = lazy(() => import('./components/SongsManagement'))
const ToursManagement = lazy(() => import('./components/ToursManagement'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))

// Компонент загрузки
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

function AppContent() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={user.role} />
      <div className="flex-1 ml-64 p-8">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Dashboard userRole={user.role} />} />
            <Route path="/groups" element={<GroupsManagement userRole={user.role} />} />
            <Route path="/songs" element={<SongsManagement userRole={user.role} />} />
            <Route path="/tours" element={<ToursManagement userRole={user.role} />} />
            <Route path="/admin" element={isAdmin ? <AdminPanel userRole={user.role} /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
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