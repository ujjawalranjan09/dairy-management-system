import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../services/api'
import { 
  Users, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  ShoppingCart,
  FileText,
  CreditCard,
  ChevronRight,
  User,
  Activity
} from 'lucide-react'

export default function Dashboard({ user }) {
  const isCustomer = user?.role === 'CUSTOMER'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await dashboardAPI.getStats()
      setStats(response.data)
    } catch (err) {
      setError('Failed to load dashboard stats')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  // Render Customer Dashboard
  if (isCustomer) {
    const todaySales = stats?.stats?.todaySales || 0
    const monthlySales = stats?.stats?.monthlySales || 0
    const pendingAmount = stats?.stats?.pendingAmount || 0
    const pendingPaymentsCount = stats?.stats?.pendingPayments || 0

    return (
      <div className="space-y-6">
        {/* Personalized Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
          <div className="relative z-10">
            <span className="bg-indigo-500/30 text-indigo-100 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Customer Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-3">
              Welcome back, {user?.name || 'Customer'}!
            </h1>
            <p className="text-indigo-100/90 mt-2 max-w-xl text-sm md:text-base">
              Here is your personal purchases, bills, and payments overview. Keep track of your daily dairy consumption and pending dues.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
            <Activity className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* Customer Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Today's Purchases */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Purchases</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{todaySales}</p>
              </div>
              <div className="w-12 h-12 text-indigo-600 bg-indigo-50 p-3 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 2: This Month's Purchases */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">This Month's Purchases</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{monthlySales}</p>
              </div>
              <div className="w-12 h-12 text-teal-600 bg-teal-50 p-3 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Total Pending Dues */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pending Dues</p>
                <p className={`text-2xl font-bold mt-1 ${pendingAmount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  ₹{pendingAmount}
                </p>
              </div>
              <div className={`w-12 h-12 p-3 rounded-xl flex items-center justify-center ${
                pendingAmount > 0 ? 'text-amber-600 bg-amber-50' : 'text-gray-500 bg-gray-50'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 4: Unpaid Bills */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unpaid Bills</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingPaymentsCount}</p>
              </div>
              <div className="w-12 h-12 text-rose-600 bg-rose-50 p-3 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Purchases List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Purchases</h2>
              <span className="text-xs text-gray-500">Last 5 entries</span>
            </div>
            {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between py-3.5 hover:bg-gray-50/55 px-2 rounded-lg transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-semibold text-sm">
                        {purchase.product.productName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{purchase.product.productName}</p>
                        <p className="text-xs text-gray-500">
                          {purchase.quantity} {purchase.product.unit} @ ₹{purchase.price}/{purchase.product.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-950">₹{purchase.quantity * purchase.price}</p>
                      <p className="text-xxs text-gray-400 mt-0.5">{new Date(purchase.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent purchases recorded yet.
              </div>
            )}
          </div>

          {/* Quick Actions & Navigation Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 font-semibold">Quick Actions</h2>
              <div className="space-y-3">
                <Link 
                  to="/billing" 
                  className="flex items-center justify-between p-3.5 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-50 rounded-xl transition font-medium text-sm group"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5" />
                    <span>View My Bills</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
                <Link 
                  to="/payments" 
                  className="flex items-center justify-between p-3.5 bg-teal-50/40 text-teal-700 hover:bg-teal-50 rounded-xl transition font-medium text-sm group"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5" />
                    <span>My Payment History</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>

            {/* Dairy Info Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Need Support?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                If you have questions about your milk deliveries, rates, or payment details, please contact the dairy administrator directly.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Dairy Administrator</p>
                  <p className="text-xxs text-gray-500">Contact owner for updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Admin/Employee Dashboard
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your dairy business</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.totalCustomers || 0}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 bg-blue-100 p-2 rounded-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats?.stats.todaySales || 0}</p>
            </div>
            <ShoppingCart className="w-12 h-12 text-green-500 bg-green-100 p-2 rounded-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.pendingPayments || 0}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-500 bg-yellow-100 p-2 rounded-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats?.stats.monthlySales || 0}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500 bg-purple-100 p-2 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Purchases */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchases</h2>
          {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
            <div className="space-y-4">
              {stats.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{purchase.customer.name}</p>
                    <p className="text-sm text-gray-600">{purchase.product.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{purchase.quantity * purchase.price}</p>
                    <p className="text-sm text-gray-500">{new Date(purchase.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent purchases</p>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h2>
          {stats?.topCustomers && stats.topCustomers.length > 0 ? (
            <div className="space-y-4">
              {stats.topCustomers.map((customer, index) => (
                <div key={customer.customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{customer.customer.name}</p>
                    <p className="text-sm text-gray-600">Total: ₹{customer.total}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No customers yet</p>
          )}
        </div>
      </div>
    </div>
  )
}