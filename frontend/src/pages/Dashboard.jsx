import { useState, useEffect } from 'react'
import { dashboardAPI } from '../services/api'
import { 
  Users, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  ShoppingCart
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isCustomer ? 'My Account Summary' : 'Dashboard'}
        </h1>
        <p className="text-gray-600">
          {isCustomer 
            ? 'Your personal purchases, bills and payments overview' 
            : 'Overview of your dairy business'}
        </p>
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