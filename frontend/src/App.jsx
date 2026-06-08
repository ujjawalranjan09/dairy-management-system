import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Products from './pages/Products'
import DailyEntry from './pages/DailyEntry'
import Billing from './pages/Billing'
import Payments from './pages/Payments'
import Users from './pages/Users'
import Layout from './components/Layout'
import { authAPI } from './services/api'

// Role constants (match backend)
const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER'
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          // Fetch fresh profile (gets latest role etc)
          const response = await authAPI.getProfile()
          const userData = response.data.user
          setUser(userData)
          setIsAuthenticated(true)
        } catch (err) {
          // Invalid/expired token
          localStorage.removeItem('token')
          setIsAuthenticated(false)
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('token')
  }

  // Role helpers
  const isAdmin = user?.role === ROLES.ADMIN
  const isEmployee = user?.role === ROLES.EMPLOYEE
  const isCustomer = user?.role === ROLES.CUSTOMER

  // Get default landing page per role
  const getDefaultRoute = () => {
    if (isCustomer) return '/dashboard' // Dashboard adapts for customer
    return '/dashboard'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && user ? (
          <Layout onLogout={handleLogout} user={user} role={user.role}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard user={user} />} />

              {/* ADMIN + EMPLOYEE mainly */}
              <Route 
                path="/customers" 
                element={isCustomer ? <Navigate to="/dashboard" replace /> : <Customers user={user} />} 
              />
              <Route 
                path="/products" 
                element={!isAdmin ? <Navigate to="/dashboard" replace /> : <Products user={user} />} 
              />
              <Route 
                path="/daily-entry" 
                element={isCustomer ? <Navigate to="/dashboard" replace /> : <DailyEntry user={user} />} 
              />

              {/* Billing & Payments - CUSTOMER sees filtered own data */}
              <Route path="/billing" element={<Billing user={user} />} />
              <Route path="/payments" element={<Payments user={user} />} />

              {/* ADMIN only: User / Staff & Customer Portal management */}
              <Route 
                path="/users" 
                element={isAdmin ? <Users user={user} /> : <Navigate to="/dashboard" replace />} 
              />

              <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
            </Routes>
          </Layout>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  )
}

export default App