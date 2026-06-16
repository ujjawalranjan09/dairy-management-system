import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../services/api'
import {
  Users,
  TrendingUp,
  Calendar,
  ShoppingCart,
  FileText,
  CreditCard,
  ChevronRight,
  Clock,
  Package
} from 'lucide-react'

export default function Dashboard({ user }) {
  const isCustomer = user?.role === 'CUSTOMER'
  const isEmployee = user?.role === 'EMPLOYEE'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { fetchStats() }, [selectedDate])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await dashboardAPI.getStats({ date: selectedDate })
      setStats(response.data)
    } catch (err) {
      setError('Could not load data. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getGreetingEmoji = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '🌅'
    if (hour < 17) return '☀️'
    return '🌆'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-bounce">🥛</div>
          <span className="text-sm text-gray-400 font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-4xl mb-3">😟</div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button onClick={fetchStats} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    )
  }

  // Customer Dashboard
  if (isCustomer) {
    const todaySales = stats?.stats?.todaySales || 0
    const monthlySales = stats?.stats?.monthlySales || 0
    const pendingAmount = stats?.stats?.pendingAmount || 0
    const pendingPaymentsCount = stats?.stats?.pendingPayments || 0

    return (
      <div className="space-y-4">
        {/* Welcome */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-5 text-white">
          <div className="relative z-10">
            <span className="text-3xl">{getGreetingEmoji()}</span>
            <h1 className="text-xl font-extrabold mt-2">
              {getGreeting()}, {user?.name || 'Friend'}!
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Here's your dairy summary
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-700">📅 Showing data for</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input text-base py-3 min-h-[48px] max-w-[170px]"
            />
            {selectedDate !== new Date().toISOString().split('T')[0] && (
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs text-brand-600 font-bold whitespace-nowrap min-h-[44px] px-3"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="text-2xl mb-2">🛒</div>
            <p className="text-xs font-bold text-gray-400 uppercase">Today</p>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5">₹{todaySales}</p>
          </div>
          <div className="card p-4">
            <div className="text-2xl mb-2">📈</div>
            <p className="text-xs font-bold text-gray-400 uppercase">This Month</p>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5">₹{monthlySales}</p>
          </div>
          <div className="card p-4">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-xs font-bold text-gray-400 uppercase">Pending Dues</p>
            <p className={`text-xl font-extrabold mt-0.5 ${pendingAmount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>₹{pendingAmount}</p>
          </div>
          <div className="card p-4">
            <div className="text-2xl mb-2">🧾</div>
            <p className="text-xs font-bold text-gray-400 uppercase">Unpaid Bills</p>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5">{pendingPaymentsCount}</p>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Recent Purchases</h2>
            <span className="text-xs text-gray-400 font-semibold">Last 5</span>
          </div>
          {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
            <div className="space-y-2">
              {stats.recentPurchases.map((purchase, i) => (
                <div key={purchase.id} className="list-item animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center text-lg">
                      🥛
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{purchase.product.productName}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        {purchase.quantity} {purchase.product.unit} × ₹{purchase.price}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 text-sm">₹{purchase.quantity * purchase.price}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{new Date(purchase.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-gray-400 text-sm">No purchases yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Quick Links</h2>
          <div className="space-y-2">
            <Link to="/billing" className="flex items-center justify-between p-4 bg-brand-50 text-brand-700 active:bg-brand-100 rounded-2xl transition font-medium text-sm min-h-[56px]">
              <div className="flex items-center gap-3">
                <span className="text-lg">🧾</span>
                <span>View My Bills</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/payments" className="flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 active:bg-emerald-100 rounded-2xl transition font-medium text-sm min-h-[56px]">
              <div className="flex items-center gap-3">
                <span className="text-lg">💰</span>
                <span>Payment History</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Admin/Employee Dashboard
  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-5 text-white">
        <div className="relative z-10">
          <span className="text-3xl">{getGreetingEmoji()}</span>
          <h1 className="text-xl font-extrabold mt-2">
            {getGreeting()}, {user?.name || 'Boss'}!
          </h1>
          <p className="text-white/80 text-sm mt-1">
            {isEmployee ? "Let's record today's entries" : "Here's your shop today"}
          </p>
        </div>
      </div>

      {/* Date */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-700">📅 Showing data for</h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input text-base py-3 min-h-[48px] max-w-[170px]"
          />
          {selectedDate !== new Date().toISOString().split('T')[0] && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs text-brand-600 font-bold whitespace-nowrap min-h-[44px] px-3"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-xs font-bold text-gray-400 uppercase">Customers</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">{stats?.stats.totalCustomers || 0}</p>
        </div>
        <div className="card p-4">
          <div className="text-2xl mb-2">🛒</div>
          <p className="text-xs font-bold text-gray-400 uppercase">Today's Sales</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">₹{stats?.stats.todaySales || 0}</p>
        </div>
        <div className="card p-4">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-xs font-bold text-gray-400 uppercase">Pending</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">{stats?.stats.pendingPayments || 0}</p>
        </div>
        <div className="card p-4">
          <div className="text-2xl mb-2">📈</div>
          <p className="text-xs font-bold text-gray-400 uppercase">This Month</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">₹{stats?.stats.monthlySales || 0}</p>
        </div>
      </div>

      {/* Cash & Online */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-2xl mb-2">💵</div>
          <p className="text-xs font-bold text-gray-400 uppercase">Cash Today</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">₹{stats?.stats.todayCashCollected || 0}</p>
        </div>
        <div className="card p-4">
          <div className="text-2xl mb-2">📱</div>
          <p className="text-xs font-bold text-gray-400 uppercase">Online Today</p>
          <p className="text-xl font-extrabold text-purple-600 mt-0.5">₹{stats?.stats.todayOnlineCollected || 0}</p>
        </div>
      </div>

      {/* Product Sales */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📦</span>
          <h2 className="text-base font-bold text-gray-900">Today's Product Sales</h2>
        </div>
        {stats?.todayProductSales && stats.todayProductSales.length > 0 ? (
          <div className="space-y-2">
            {stats.todayProductSales.map((item, i) => (
              <div key={item.productId} className="list-item animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center text-lg">
                    🥛
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-400 font-medium">{item.quantity} {item.unit}</p>
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-sm">₹{item.totalSales}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-400 text-sm">No products sold today</p>
          </div>
        )}
      </div>

      {/* Staff Performance (Admin only) */}
      {!isEmployee && stats?.employeeStats && stats.employeeStats.length > 0 && (
        <div className="card p-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">👨‍💼 Staff Performance</h2>
          <div className="space-y-2">
            {stats.employeeStats.map((emp, i) => (
              <div key={emp.id} className="list-item animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{emp.customersManagedCount} customers</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-emerald-600 text-sm">₹{emp.totalPaymentsCollected || 0}</p>
                  <p className="text-xs text-gray-400 font-medium">Cash: ₹{emp.cashCollected || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Purchases */}
      <div className="card p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Recent Purchases</h2>
        {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
          <div className="space-y-2">
            {stats.recentPurchases.map((purchase, i) => (
              <div key={purchase.id} className="list-item animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{purchase.customer.name}</p>
                  <p className="text-xs text-gray-400 font-medium">{purchase.product.productName}</p>
                  {purchase.creator && (
                    <p className="text-xs text-gray-300 font-medium mt-0.5">by {purchase.creator.name}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 text-sm">₹{purchase.quantity * purchase.price}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{new Date(purchase.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-400 text-sm">No recent purchases</p>
          </div>
        )}
      </div>

      {/* Top Customers */}
      <div className="card p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">🏆 Top Customers</h2>
        {stats?.topCustomers && stats.topCustomers.length > 0 ? (
          <div className="space-y-2">
            {stats.topCustomers.map((customer, index) => (
              <div key={customer.customer.id} className="list-item animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{customer.customer.name}</p>
                    <p className="text-xs text-gray-400 font-medium">Total: ₹{customer.total}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-400 text-sm">No customers yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
