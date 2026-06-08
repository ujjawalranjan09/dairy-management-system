import { useState, useEffect } from 'react'
import { billingAPI, customerAPI } from '../services/api'
import { 
  Calendar,
  Users,
  FileText,
  Download,
  Search
} from 'lucide-react'

export default function Billing({ user }) {
  const isCustomer = user?.role === 'CUSTOMER'
  const [billing, setBilling] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCustomer, setSelectedCustomer] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (customers.length > 0) {
      fetchBilling()
    }
  }, [selectedMonth, selectedYear, selectedCustomer])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const customersResponse = await customerAPI.getAll()
      setCustomers(customersResponse.data.customers)
    } catch (err) {
      setError('Failed to load customers')
      console.error(err)
    }
  }

  const fetchBilling = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (selectedCustomer) {
        // Fetch specific customer billing
        const response = await billingAPI.getCustomer(
          selectedCustomer,
          { month: selectedMonth, year: selectedYear }
        )
        setBilling([response.data])
      } else {
        // Fetch monthly billing for all customers
        const response = await billingAPI.getMonthly({
          month: selectedMonth,
          year: selectedYear
        })
        setBilling(response.data.billing || [])
      }
    } catch (err) {
      setError('Failed to load billing data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateGrandTotal = () => {
    return billing.reduce((total, bill) => total + bill.total, 0)
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{isCustomer ? 'My Bills' : 'Billing'}</h1>
        <p className="text-gray-600">{isCustomer ? 'Your monthly purchase statements' : 'Generate and view monthly bills'}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
              Customer (Optional)
            </label>
            <select
              id="customer"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchBilling}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Search className="w-5 h-5 mr-2" />
              Generate Bill
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {!loading && billing.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{billing.length}</div>
              <div className="text-sm text-blue-600">Customers</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">₹{calculateGrandTotal()}</div>
              <div className="text-sm text-green-600">Total Amount</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {months[selectedMonth - 1]} {selectedYear}
              </div>
              <div className="text-sm text-purple-600">Billing Period</div>
            </div>
          </div>
        </div>
      )}

      {/* Bills */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : billing.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No billing data found for the selected period</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {billing.map((bill, index) => (
              <div key={index} className="p-6">
                {/* Customer Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{bill.customer.name}</h3>
                      <p className="text-sm text-gray-600">{bill.customer.phoneNumber}</p>
                      <p className="text-sm text-gray-500">{bill.customer.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(bill.paymentStatus)}`}>
                      {bill.paymentStatus}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Total: ₹{bill.total}
                    </p>
                  </div>
                </div>

                {/* Product Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Product Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(bill.productBreakdown || {}).map(([productName, details]) => (
                        <div key={productName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{productName}</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">{details.quantity} units</div>
                            <div className="text-sm font-medium">₹{details.total}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Purchase History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {bill.purchases && bill.purchases.map((purchase) => (
                        <div key={purchase.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{purchase.product.productName}</span>
                            <span className="text-xs text-gray-500 ml-2">{purchase.quantity} units</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">₹{purchase.quantity * purchase.price}</div>
                            <div className="text-xs text-gray-500">{formatDate(purchase.date)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex justify-end space-x-3">
                  <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                </div>

                {index < billing.length - 1 && <hr className="my-6" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}