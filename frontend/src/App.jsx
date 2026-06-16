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
import Stock from './pages/Stock'
import Outstanding from './pages/Outstanding'
import WhatsApp from './pages/WhatsApp'
import Layout from './components/Layout'
import { authAPI } from './services/api'

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
          const response = await authAPI.getProfile()
          const userData = response.data.user
          setUser(userData)
          setIsAuthenticated(true)
        } catch (err) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="text-6xl">🥛</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-sm text-gray-400 font-medium">Loading your shop...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        {isAuthenticated && user ? (
          <Layout onLogout={handleLogout} user={user} role={user.role}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route 
                path="/customers" 
                element={user.role === ROLES.CUSTOMER ? <Navigate to="/dashboard" replace /> : <Customers user={user} />} 
              />
              <Route 
                path="/products" 
                element={user.role !== ROLES.ADMIN ? <Navigate to="/dashboard" replace /> : <Products user={user} />} 
              />
              <Route 
                path="/daily-entry" 
                element={user.role === ROLES.CUSTOMER ? <Navigate to="/dashboard" replace /> : <DailyEntry user={user} />} 
              />
              <Route path="/billing" element={<Billing user={user} />} />
              <Route path="/payments" element={<Payments user={user} />} />
              <Route 
                path="/users" 
                element={user.role === ROLES.ADMIN ? <Users user={user} /> : <Navigate to="/dashboard" replace />} 
              />
              <Route 
                path="/stock" 
                element={user.role === ROLES.CUSTOMER ? <Navigate to="/dashboard" replace /> : <Stock user={user} />} 
              />
              <Route 
                path="/outstanding" 
                element={user.role === ROLES.CUSTOMER ? <Navigate to="/dashboard" replace /> : <Outstanding user={user} />} 
              />
              <Route 
                path="/whatsapp" 
                element={user.role !== ROLES.ADMIN ? <Navigate to="/dashboard" replace /> : <WhatsApp user={user} />} 
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
