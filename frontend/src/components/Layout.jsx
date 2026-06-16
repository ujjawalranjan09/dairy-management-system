import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Users,
  ShoppingCart,
  Package,
  FileText,
  CreditCard,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronLeft
} from 'lucide-react'

import InstallPrompt from './InstallPrompt'

const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER'
}

const adminNav = [
  { name: 'Home', href: '/dashboard', icon: Home, emoji: '🏠' },
  { name: 'Customers', href: '/customers', icon: Users, emoji: '👥' },
  { name: 'Products', href: '/products', icon: Package, emoji: '📦' },
  { name: 'Add Entry', href: '/daily-entry', icon: ShoppingCart, emoji: '📝' },
  { name: 'Bills', href: '/billing', icon: FileText, emoji: '🧾' },
  { name: 'Payments', href: '/payments', icon: CreditCard, emoji: '💰' },
  { name: 'Team', href: '/users', icon: Settings, emoji: '👨‍👩‍👧' },
]

const employeeNav = [
  { name: 'Home', href: '/dashboard', icon: Home, emoji: '🏠' },
  { name: 'Customers', href: '/customers', icon: Users, emoji: '👥' },
  { name: 'Add Entry', href: '/daily-entry', icon: ShoppingCart, emoji: '📝' },
  { name: 'Bills', href: '/billing', icon: FileText, emoji: '🧾' },
  { name: 'Payments', href: '/payments', icon: CreditCard, emoji: '💰' },
]

const customerNav = [
  { name: 'Home', href: '/dashboard', icon: Home, emoji: '🏠' },
  { name: 'My Bills', href: '/billing', icon: FileText, emoji: '🧾' },
  { name: 'Payments', href: '/payments', icon: CreditCard, emoji: '💰' },
]

const getNavigation = (role) => {
  if (role === ROLES.ADMIN) return adminNav
  if (role === ROLES.EMPLOYEE) return employeeNav
  if (role === ROLES.CUSTOMER) return customerNav
  return adminNav
}

const getBottomNavItems = (role) => {
  if (role === ROLES.CUSTOMER) {
    return [
      { name: 'Home', href: '/dashboard', icon: Home, emoji: '🏠' },
      { name: 'Bills', href: '/billing', icon: FileText, emoji: '🧾' },
      { name: 'Payments', href: '/payments', icon: CreditCard, emoji: '💰' },
    ]
  }
  if (role === ROLES.EMPLOYEE) {
    return [
      { name: 'Home', href: '/dashboard', icon: Home, emoji: '🏠' },
      { name: 'People', href: '/customers', icon: Users, emoji: '👥' },
      { name: 'Entry', href: '/daily-entry', icon: ShoppingCart, emoji: '📝' },
      { name: 'Bills', href: '/billing', icon: FileText, emoji: '🧾' },
      { name: 'Pay', href: '/payments', icon: CreditCard, emoji: '💰' },
    ]
  }
  return [
    { name: 'Home', href: '/dashboard', icon: Home, emoji: '🏠' },
    { name: 'People', href: '/customers', icon: Users, emoji: '👥' },
    { name: 'Entry', href: '/daily-entry', icon: ShoppingCart, emoji: '📝' },
    { name: 'Bills', href: '/billing', icon: FileText, emoji: '🧾' },
    { name: 'More', href: '/users', icon: Settings, emoji: '⚙️' },
  ]
}

export default function Layout({ children, onLogout, user, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = getNavigation(role)
  const bottomNavItems = getBottomNavItems(role)
  const currentNavItem = navigation.find(item => item.href === location.pathname)

  const closeSidebar = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSidebarOpen(false)
      setIsClosing(false)
    }, 200)
  }

  useEffect(() => {
    closeSidebar()
  }, [location.pathname])

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-200 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div
          className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          onClick={closeSidebar}
        ></div>
        <div className={`relative flex flex-col w-72 max-w-[85vw] h-full bg-white shadow-2xl transition-transform duration-200 ease-out ${isClosing ? '-translate-x-full' : 'translate-x-0'}`}>
          {/* Sidebar header */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🥛</div>
                <div>
                  <h1 className="text-base font-bold text-gray-900">My Dairy Shop</h1>
                  <div className="text-xs text-brand-600 font-semibold">
                    {role === ROLES.ADMIN ? '👑 Owner' : role === ROLES.EMPLOYEE ? '👤 Staff' : '🧑 Customer'}
                  </div>
                </div>
              </div>
              <button onClick={closeSidebar} className="p-2 text-gray-400 active:text-gray-600 rounded-xl active:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 min-h-[48px] active:scale-95 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 active:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.name}</span>
                  {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-brand-500"></div>}
                </Link>
              )
            })}
          </div>

          {/* User section */}
          <div className="px-3 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center">
                <span className="text-sm font-bold text-brand-700">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-400 font-medium">
                  {role === ROLES.ADMIN ? 'Owner' : role === ROLES.EMPLOYEE ? 'Staff' : 'Customer'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 active:text-rose-600 active:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-100">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🥛</div>
              <div>
                <div className="text-base font-bold text-gray-900">My Dairy Shop</div>
                <div className="text-xs text-brand-600 font-semibold">
                  {role === ROLES.ADMIN ? '👑 Owner' : role === ROLES.EMPLOYEE ? '👤 Staff' : '🧑 Customer'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col flex-1 overflow-y-auto scrollbar-hide">
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span>{item.name}</span>
                    {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-brand-500"></div>}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User section */}
          <div className="px-3 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center">
                <span className="text-sm font-bold text-brand-700">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-400 font-medium">
                  {role === ROLES.ADMIN ? 'Owner' : role === ROLES.EMPLOYEE ? 'Staff' : 'Customer'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center h-14 px-4 bg-white/90 backdrop-blur-xl border-b border-gray-100 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 active:text-gray-900 rounded-xl active:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 ml-2 flex items-center gap-2">
            <span className="text-lg">🥛</span>
            <h1 className="text-sm font-bold text-gray-900">My Dairy Shop</h1>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 active:text-rose-600 active:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-4 md:py-6 has-bottom-nav">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8 animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-bottom-nav">
          <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[56px] active:scale-95 ${
                    isActive
                      ? 'text-brand-600'
                      : 'text-gray-400 active:text-gray-600'
                  }`}
                >
                  <div className={`p-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-brand-50' : ''
                  }`}>
                    <span className="text-lg">{item.emoji}</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-600' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Install App Prompt */}
      <InstallPrompt />
    </>
  )
}
