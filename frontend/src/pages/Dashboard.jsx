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
  const isEmployee = user?.role === 'EMPLOYEE'
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10">
          <span className="bg-indigo-500/30 text-indigo-100 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {isEmployee ? 'Employee Workspace' : 'Administrator Console'}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-3">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-slate-350 mt-2 max-w-xl text-sm md:text-base">
            {isEmployee 
              ? 'Record daily entries, register new customers, compile billing cycles, and record customer payments.' 
              : 'Configure items and rates, provision employee/customer accounts, monitor transactions, and inspect growth stats.'}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Activity className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.stats.totalCustomers || 0}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 bg-blue-50 p-3 rounded-xl flex items-center justify-center" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats?.stats.todaySales || 0}</p>
            </div>
            <ShoppingCart className="w-12 h-12 text-green-500 bg-green-50 p-3 rounded-xl flex items-center justify-center" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.stats.pendingPayments || 0}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-500 bg-yellow-50 p-3 rounded-xl flex items-center justify-center" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats?.stats.monthlySales || 0}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500 bg-purple-50 p-3 rounded-xl flex items-center justify-center" />
          </div>
        </div>
      </div>

      {/* Today's Collection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Cash Collection</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">₹{stats?.stats.todayCashCollected || 0}</p>
          </div>
          <div className="w-12 h-12 text-amber-600 bg-amber-50 rounded-xl flex items-center justify-center text-xl">
            💵
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Online Collection</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">₹{stats?.stats.todayOnlineCollected || 0}</p>
          </div>
          <div className="w-12 h-12 text-purple-600 bg-purple-50 rounded-xl flex items-center justify-center text-xl">
            🌐
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Product Sales Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-950 mb-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Today's Product Sales Breakdown
          </h2>
          <p className="text-xs text-gray-500 mb-4">Quantity and total sales revenue of each product sold today</p>
          {stats?.todayProductSales && stats.todayProductSales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/70">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {stats.todayProductSales.map((item) => (
                    <tr key={item.productId} className="hover:bg-gray-50/40 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        ₹{item.totalSales}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm italic">
              No products sold today yet
            </div>
          )}
        </div>

        {/* Employee Performance Console */}
        {!isEmployee && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-950 mb-1">Employee Management Console</h2>
            <p className="text-xs text-gray-500 mb-4">Summary of customers managed and payments collected by staff members</p>
            {stats?.employeeStats && stats.employeeStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/70">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Customers Managed</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cash Collected</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Online Collected</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {stats.employeeStats.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50/40 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">
                          {emp.name}
                          <span className="block text-xs text-gray-400 font-normal">{emp.email}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-indigo-700">
                          {emp.customersManagedCount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-amber-600">
                          ₹{emp.cashCollected || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-purple-600">
                          ₹{emp.onlineCollected || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-emerald-600">
                          ₹{emp.totalPaymentsCollected || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                No active employee records or operations logged yet
              </div>
            )}
          </div>
        )}

        {/* Recent Purchases */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-950 mb-4">Recent Purchases</h2>
          {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
            <div className="space-y-4">
              {stats.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100/60 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{purchase.customer.name}</p>
                    <p className="text-xs text-gray-600">{purchase.product.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-950">₹{purchase.quantity * purchase.price}</p>
                    <p className="text-xxs text-gray-400 mt-0.5">{new Date(purchase.date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">No recent purchases</p>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-950 mb-4">Top Customers</h2>
          {stats?.topCustomers && stats.topCustomers.length > 0 ? (
            <div className="space-y-4">
              {stats.topCustomers.map((customer, index) => (
                <div key={customer.customer.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100/60 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{customer.customer.name}</p>
                    <p className="text-xs text-gray-600">Total: ₹{customer.total}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-lg">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">No customers yet</p>
          )}
        </div>
      </div>
    </div>
  )
}