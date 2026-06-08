import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  FileText, 
  CreditCard, 
  LogOut,
  Menu,
  X,
  UserCog
} from 'lucide-react'

const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER'
}

// Full navigation for ADMIN
const adminNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Daily Entry', href: '/daily-entry', icon: ShoppingCart },
  { name: 'Billing', href: '/billing', icon: FileText },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Users & Portals', href: '/users', icon: UserCog },
]

// Employee sees operational tools (no Products management, no user management)
const employeeNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Daily Entry', href: '/daily-entry', icon: ShoppingCart },
  { name: 'Billing', href: '/billing', icon: FileText },
  { name: 'Payments', href: '/payments', icon: CreditCard },
]

// Customer sees personal portal (filtered data via backend)
const customerNav = [
  { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Bills', href: '/billing', icon: FileText },
  { name: 'My Payments', href: '/payments', icon: CreditCard },
]

const getNavigation = (role) => {
  if (role === ROLES.ADMIN) return adminNav
  if (role === ROLES.EMPLOYEE) return employeeNav
  if (role === ROLES.CUSTOMER) return customerNav
  return adminNav
}

export default function Layout({ children, onLogout, user, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const navigation = getNavigation(role)
  const currentNavItem = navigation.find(item => item.href === location.pathname)
  const roleLabel = role === ROLES.ADMIN ? 'Administrator' : role === ROLES.EMPLOYEE ? 'Employee' : 'Customer'

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex flex-col w-full max-w-xs bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 pt-5 pb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dairy ERP</h1>
              <div className="text-xs text-indigo-600 font-medium">{roleLabel}</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    location.pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
          <div className="px-2 py-4 border-t border-gray-200">
            <div className="px-2 py-1 text-xs font-medium text-indigo-600">{roleLabel}</div>
            <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-600">
              <span>{user?.name || 'User'}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
          <div className="px-4 py-5 border-b border-gray-200">
            <div className="font-bold text-gray-900">Dairy ERP</div>
            <div className="text-xs text-indigo-600 font-semibold tracking-wide mt-0.5">{roleLabel}</div>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      location.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="px-2 text-xs font-medium text-indigo-600">{roleLabel}</div>
            <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-600">
              <span>{user?.name || 'User'}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center h-16 px-4 bg-white border-b border-gray-200 shadow-sm md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 ml-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {currentNavItem?.name || 'Dashboard'}
            </h1>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}