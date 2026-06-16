import { useState, useEffect } from 'react'
import { paymentAPI, customerAPI, billingAPI, advanceAPI } from '../services/api'
import {
  CreditCard, Search, Plus, CheckCircle, XCircle, Wallet, TrendingUp, Clock, X
} from 'lucide-react'
import SearchableCustomerSelect from '../components/SearchableCustomerSelect'

export default function Payments({ user }) {
  const isCustomer = user?.role === 'CUSTOMER'
  const [payments, setPayments] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(user?.role === 'EMPLOYEE')
  const [modalShowOnlyAssigned, setModalShowOnlyAssigned] = useState(user?.role === 'EMPLOYEE')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalCustomerId, setModalCustomerId] = useState('')
  const [modalMonth, setModalMonth] = useState(new Date().getMonth() + 1)
  const [modalYear, setModalYear] = useState(new Date().getFullYear())
  const [modalAmount, setModalAmount] = useState('')
  const [modalMethod, setModalMethod] = useState('CASH')
  const [advanceBalances, setAdvanceBalances] = useState([])
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [advanceCustomerId, setAdvanceCustomerId] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceMethod, setAdvanceMethod] = useState('CASH')
  const [advanceNote, setAdvanceNote] = useState('')

  const resetModal = () => {
    setModalCustomerId('')
    setModalMonth(new Date().getMonth() + 1)
    setModalYear(new Date().getFullYear())
    setModalAmount('')
    setModalMethod('CASH')
  }

  const resetAdvanceModal = () => {
    setAdvanceCustomerId('')
    setAdvanceAmount('')
    setAdvanceMethod('CASH')
    setAdvanceNote('')
  }

  const handleRecordAdvance = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await advanceAPI.create({
        customerId: parseInt(advanceCustomerId),
        amount: parseFloat(advanceAmount),
        method: advanceMethod,
        note: advanceNote
      })
      setSuccess('✅ Advance payment recorded!')
      setShowAdvanceModal(false)
      resetAdvanceModal()
      fetchAdvances()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record advance')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdvances = async () => {
    try {
      const res = await advanceAPI.getAll()
      setAdvanceBalances(res.data.balances || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { if (!isCustomer) fetchAdvances() }, [])

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await paymentAPI.create({
        customerId: parseInt(modalCustomerId),
        amount: parseFloat(modalAmount),
        month: parseInt(modalMonth),
        year: parseInt(modalYear),
        method: modalMethod
      })
      setSuccess('✅ Payment recorded!')
      setIsModalOpen(false)
      resetModal()
      fetchPayments()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record payment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchBillTotal = async () => {
      if (modalCustomerId && modalMonth && modalYear) {
        try {
          const response = await billingAPI.getCustomer(modalCustomerId, { month: modalMonth, year: modalYear })
          if (response.data?.total !== undefined) setModalAmount(response.data.total.toString())
        } catch (err) { console.error(err) }
      }
    }
    fetchBillTotal()
  }, [modalCustomerId, modalMonth, modalYear])

  useEffect(() => { fetchInitialData() }, [])
  useEffect(() => { fetchPayments() }, [selectedMonth, selectedYear, selectedCustomer, statusFilter])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      if (!isCustomer) {
        const customersResponse = await customerAPI.getAll()
        setCustomers(customersResponse.data.customers)
      }
    } catch (err) {
      setError('Could not load customers')
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
      if (selectedCustomer) filteredPayments = filteredPayments.filter(p => p.customerId === parseInt(selectedCustomer))
      setPayments(filteredPayments)
    } catch (err) {
      setError('Could not load payments')
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (paymentId) => {
    try {
      setLoading(true)
      const response = await paymentAPI.markAsPaid(paymentId)
      setPayments(payments.map(p => p.id === paymentId ? { ...p, status: 'PAID', paymentDate: response.data.payment.paymentDate } : p))
      setSuccess('✅ Payment marked as paid!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Could not mark payment')
    } finally {
      setLoading(false)
    }
  }

  const markAsFailed = async (paymentId) => {
    try {
      setLoading(true)
      await paymentAPI.markAsFailed(paymentId)
      setPayments(payments.map(p => p.id === paymentId ? { ...p, status: 'FAILED', paymentDate: null } : p))
      setSuccess('✅ Payment marked as failed')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Could not update payment')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const paidAmount = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0)
    const pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount), 0)
    return { totalAmount, paidAmount, pendingAmount }
  }

  const getPaymentStatusEmoji = (status) => {
    switch (status) {
      case 'PAID': return '✅'
      case 'PENDING': return '⏳'
      case 'FAILED': return '❌'
      default: return '❓'
    }
  }

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const displayCustomers = user?.role === 'EMPLOYEE' && showOnlyAssigned
    ? customers.filter(c => c.assignedEmployeeId === user.id)
    : customers
  const modalDisplayCustomers = user?.role === 'EMPLOYEE' && modalShowOnlyAssigned
    ? customers.filter(c => c.assignedEmployeeId === user.id)
    : customers

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="page-title">{isCustomer ? '💰 My Payments' : '💰 Payments'}</h1>
          <p className="page-subtitle">{isCustomer ? 'Your payment history' : 'Track customer payments'}</p>
        </div>
        {!isCustomer && (
          <div className="flex gap-2">
            <button onClick={() => setIsModalOpen(true)} className="btn-primary h-12 flex-shrink-0 active:scale-95">
              <Plus className="w-4 h-4 mr-1.5" />
              Record Payment
            </button>
            <button onClick={() => setShowAdvanceModal(true)} className="btn-success h-12 flex-shrink-0 active:scale-95">
              <Plus className="w-4 h-4 mr-1.5" />
              💰 Advance
            </button>
          </div>
        )}
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">⚠️ {error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-medium">{success}</div>}

      {/* Filters */}
      <div className="card p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">📅 Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="select text-base py-3 min-h-[52px]">
              {months.map((month, index) => <option key={index} value={index + 1}>{month}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="select text-base py-3 min-h-[52px]">
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          {!isCustomer && (
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">👤 Customer</label>
                {user?.role === 'EMPLOYEE' && (
                  <label className="inline-flex items-center text-xs text-brand-600 font-bold cursor-pointer">
                    <input type="checkbox" checked={showOnlyAssigned} onChange={(e) => setShowOnlyAssigned(e.target.checked)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 mr-1 h-4 w-4" />
                    Mine
                  </label>
                )}
              </div>
              <SearchableCustomerSelect customers={displayCustomers} value={selectedCustomer} onChange={setSelectedCustomer} placeholder="All Customers" showAllOption={true} allOptionLabel="All Customers" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select text-base py-3 min-h-[52px]">
              <option value="">All</option>
              <option value="PENDING">⏳ Pending</option>
              <option value="PAID">✅ Paid</option>
              <option value="FAILED">❌ Failed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchPayments} className="btn-primary w-full h-12 active:scale-95">
              <Search className="w-4 h-4 mr-1.5" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="text-lg mb-1">💰</div>
            <p className="text-base font-extrabold text-gray-900">₹{calculateTotals().totalAmount}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg mb-1">✅</div>
            <p className="text-base font-extrabold text-emerald-600">₹{calculateTotals().paidAmount}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Paid</p>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg mb-1">⏳</div>
            <p className="text-base font-extrabold text-amber-600">₹{calculateTotals().pendingAmount}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Pending</p>
          </div>
        </div>
      )}

      {/* Payment List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-4xl animate-bounce">🥛</div>
        </div>
      ) : payments.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">💰</div>
          <p className="text-gray-500 font-medium text-sm">No payments found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment, i) => (
            <div key={payment.id} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg ${
                  payment.status === 'PAID' ? 'bg-emerald-50' :
                  payment.status === 'FAILED' ? 'bg-rose-50' :
                  'bg-amber-50'
                }`}>
                  {getPaymentStatusEmoji(payment.status)}
                </div>
                <div className="flex-1 min-w-0">
                  {!isCustomer && (
                    <p className="font-semibold text-gray-900 text-base truncate">{payment.customer.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 font-medium">{months[payment.month - 1]} {payment.year}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      payment.method === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {payment.method === 'ONLINE' ? '📱 Online' : '💵 Cash'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 text-base">₹{payment.amount}</p>
                  <span className={`text-[10px] font-bold ${
                    payment.status === 'PAID' ? 'text-emerald-600' :
                    payment.status === 'FAILED' ? 'text-rose-600' :
                    'text-amber-600'
                  }`}>
                    {getPaymentStatusEmoji(payment.status)} {payment.status}
                  </span>
                </div>
              </div>

              {!isCustomer && payment.status === 'PENDING' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => markAsPaid(payment.id)} className="btn-success flex-1 h-12 text-sm active:scale-95">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    ✅ Mark Paid
                  </button>
                  <button onClick={() => markAsFailed(payment.id)} className="btn-danger flex-1 h-12 text-sm active:scale-95">
                    <XCircle className="w-4 h-4 mr-1" />
                    ❌ Failed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Advance Balances */}
      {!isCustomer && advanceBalances.length > 0 && (
        <div className="card p-4 md:p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">💰 Customer Advance Balances</h2>
          <div className="space-y-2">
            {advanceBalances.map((b, i) => (
              <div key={i} className="list-item animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center font-bold text-sm">
                    {b.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{b.customer.name}</p>
                    <p className="text-xs text-gray-400">📱 {b.customer.phoneNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600 text-base">₹{Math.round(b.totalRemaining)}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">ADVANCE</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); resetModal() }}></div>
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">💰 Record Payment</h2>
              <button onClick={() => { setIsModalOpen(false); resetModal() }} className="p-2 text-gray-400 active:text-gray-600 active:bg-gray-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-gray-700">👤 Customer</label>
                  {user?.role === 'EMPLOYEE' && (
                    <label className="inline-flex items-center text-xs text-brand-600 font-bold cursor-pointer">
                      <input type="checkbox" checked={modalShowOnlyAssigned} onChange={(e) => setModalShowOnlyAssigned(e.target.checked)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 mr-1 h-4 w-4" />
                      My customers only
                    </label>
                  )}
                </div>
                <SearchableCustomerSelect customers={modalDisplayCustomers} value={modalCustomerId} onChange={setModalCustomerId} placeholder="Search customer..." required={true} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">📅 Month</label>
                  <select value={modalMonth} onChange={(e) => setModalMonth(parseInt(e.target.value))} className="select text-base py-3 min-h-[52px]" required>
                    {months.map((m, index) => <option key={index} value={index + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Year</label>
                  <select value={modalYear} onChange={(e) => setModalYear(parseInt(e.target.value))} className="select text-base py-3 min-h-[52px]" required>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">💰 Amount (₹)</label>
                  <input type="number" inputMode="decimal" value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} placeholder="Amount" className="input text-base min-h-[52px]" min="1" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">💳 Method</label>
                  <select value={modalMethod} onChange={(e) => setModalMethod(e.target.value)} className="select text-base py-3 min-h-[52px]" required>
                    <option value="CASH">💵 Cash</option>
                    <option value="ONLINE">📱 Online</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setIsModalOpen(false); resetModal() }} className="btn-secondary flex-1 h-12 active:scale-95">Cancel</button>
                <button type="submit" className="btn-primary flex-1 h-12 active:scale-95">✅ Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setShowAdvanceModal(false); resetAdvanceModal() }}></div>
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">💰 Record Advance</h2>
              <button onClick={() => { setShowAdvanceModal(false); resetAdvanceModal() }} className="p-2 text-gray-400 active:text-gray-600 active:bg-gray-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordAdvance} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">👤 Customer</label>
                <SearchableCustomerSelect customers={displayCustomers} value={advanceCustomerId} onChange={setAdvanceCustomerId} placeholder="Search customer..." required={true} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">💰 Amount (₹)</label>
                <input type="number" inputMode="decimal" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="Enter amount" className="input text-base min-h-[52px]" min="1" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">💳 Method</label>
                <select value={advanceMethod} onChange={(e) => setAdvanceMethod(e.target.value)} className="select text-base py-3 min-h-[52px]">
                  <option value="CASH">💵 Cash</option>
                  <option value="ONLINE">📱 Online</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">📝 Note (optional)</label>
                <input type="text" value={advanceNote} onChange={(e) => setAdvanceNote(e.target.value)} placeholder="e.g. Advance for June" className="input text-base min-h-[52px]" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setShowAdvanceModal(false); resetAdvanceModal() }} className="btn-secondary flex-1 h-12">Cancel</button>
                <button type="submit" className="btn-success flex-1 h-12">💰 Record Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
