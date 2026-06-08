import { useState, useEffect } from 'react'
import { paymentAPI, customerAPI } from '../services/api'
import { 
  CreditCard,
  Calendar,
  Search,
  Plus,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function Payments({ user }) {
  const isCustomer = user?.role === 'CUSTOMER'
  const [payments, setPayments] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Record Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalCustomerId, setModalCustomerId] = useState('')
  const [modalMonth, setModalMonth] = useState(new Date().getMonth() + 1)
  const [modalYear, setModalYear] = useState(new Date().getFullYear())
  const [modalAmount, setModalAmount] = useState('')

  const resetModal = () => {
    setModalCustomerId('')
    setModalMonth(new Date().getMonth() + 1)
    setModalYear(new Date().getFullYear())
    setModalAmount('')
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await paymentAPI.create({
        customerId: parseInt(modalCustomerId),
        amount: parseFloat(modalAmount),
        month: parseInt(modalMonth),
        year: parseInt(modalYear)
      })
      setSuccess(response.data.message || 'Payment recorded successfully!')
      setIsModalOpen(false)
      resetModal()
      fetchPayments()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [selectedMonth, selectedYear, selectedCustomer, statusFilter])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      if (!isCustomer) {
        const customersResponse = await customerAPI.getAll()
        setCustomers(customersResponse.data.customers)
      } else {
        setCustomers([])
      }
    } catch (err) {
      setError('Failed to load customers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = { month: selectedMonth, year: selectedYear }
      if (statusFilter) params.status = statusFilter
      
      const response = await paymentAPI.getAll(params)
      let filteredPayments = response.data.payments

      if (selectedCustomer) {
        filteredPayments = filteredPayments.filter(p => p.customerId === parseInt(selectedCustomer))
      }

      setPayments(filteredPayments)
    } catch (err) {
      setError('Failed to load payments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (paymentId) => {
    try {
      setLoading(true)
      const response = await paymentAPI.markAsPaid(paymentId)
      setPayments(payments.map(p => 
        p.id === paymentId ? { ...p, status: 'PAID', paymentDate: response.data.payment.paymentDate } : p
      ))
      setSuccess('Payment marked as paid successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to mark payment as paid')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const paidAmount = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
    const pendingAmount = totalAmount - paidAmount
    return { totalAmount, paidAmount, pendingAmount }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isCustomer ? 'My Payments' : 'Payments'}</h1>
          <p className="text-gray-600">{isCustomer ? 'Your payment history and status' : 'Manage customer payments and track payment status'}</p>
        </div>
        {!isCustomer && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Record Payment
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className={`grid grid-cols-1 gap-4 ${isCustomer ? 'md:grid-cols-4' : 'md:grid-cols-5'}`}>
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
          {!isCustomer && (
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
                Customer
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
          )}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchPayments}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Search className="w-5 h-5 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {!loading && payments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">₹{calculateTotals().totalAmount}</div>
              <div className="text-sm text-blue-600">Total Amount</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">₹{calculateTotals().paidAmount}</div>
              <div className="text-sm text-green-600">Paid Amount</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">₹{calculateTotals().pendingAmount}</div>
              <div className="text-sm text-yellow-600">Pending Amount</div>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payments found for the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {!isCustomer && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month/Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  {!isCustomer && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    {!isCustomer && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{payment.customer.name}</div>
                            <div className="text-sm text-gray-500">{payment.customer.phoneNumber}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {months[payment.month - 1]} {payment.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : 'Not paid'}
                    </td>
                    {!isCustomer && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {payment.status === 'PENDING' && (
                          <button
                            onClick={() => markAsPaid(payment.id)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <CheckCircle className="w-5 h-5 mr-1" />
                            Mark as Paid
                          </button>
                        )}
                        {payment.status === 'PAID' && (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-1" />
                            Paid
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 font-semibold">Record Payment</h2>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={modalCustomerId}
                  onChange={(e) => setModalCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={modalMonth}
                    onChange={(e) => setModalMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    {months.map((m, index) => (
                      <option key={index} value={index + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={modalYear}
                    onChange={(e) => setModalYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetModal()
                  }}
                  className="px-4 py-2 border border-gray-350 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}