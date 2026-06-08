import { useState, useEffect } from 'react'
import { billingAPI, customerAPI } from '../services/api'
import { 
  Calendar,
  Users,
  FileText,
  Download,
  Search,
  DollarSign,
  Clock,
  CreditCard,
  Receipt,
  User,
  MapPin,
  Phone,
  Printer,
  ChevronRight
} from 'lucide-react'
import SearchableCustomerSelect from '../components/SearchableCustomerSelect'

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
    if (isCustomer || customers.length > 0) {
      fetchBilling()
    }
  }, [selectedMonth, selectedYear, selectedCustomer, customers])

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

  const calculateTotalPaid = () => {
    return billing.reduce((total, bill) => total + (bill.totalPaid || 0), 0)
  }

  const calculateTotalRemaining = () => {
    return billing.reduce((total, bill) => total + (bill.remainingAmount !== undefined ? bill.remainingAmount : bill.total), 0)
  }

  const getPaymentStatusStyle = (status) => {
    switch (status) {
      case 'PAID': 
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          text: 'text-emerald-600',
          bg: 'bg-emerald-500'
        }
      case 'PARTIALLY PAID': 
        return {
          badge: 'bg-sky-50 text-sky-700 border-sky-200',
          text: 'text-sky-600',
          bg: 'bg-sky-500'
        }
      case 'PENDING': 
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          text: 'text-amber-600',
          bg: 'bg-amber-500'
        }
      default: 
        return {
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
          text: 'text-slate-600',
          bg: 'bg-slate-500'
        }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  // Determine Customer Metrics or Admin Metrics
  const firstBill = billing[0] || null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {isCustomer ? 'My Bills' : 'Billing & Invoices'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isCustomer ? 'Track your monthly purchase statements and payment status' : 'Generate, review, and track monthly client statements'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Filters Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            <div className="md:col-span-3">
              <label htmlFor="month" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Billing Month
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="year" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Billing Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {!isCustomer && (
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Customer
                </label>
                <SearchableCustomerSelect
                  customers={customers}
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  placeholder="All Customers"
                  showAllOption={true}
                  allOptionLabel="All Customers"
                />
              </div>
            )}
            <div className={`${isCustomer ? 'md:col-span-6' : 'md:col-span-3'} flex items-end`}>
              <button
                onClick={fetchBilling}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all duration-150"
              >
                <Search className="w-4.5 h-4.5" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      {!loading && billing.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Billing Period</span>
              <span className="text-lg font-bold text-slate-800 block">
                {months[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isCustomer ? 'Total Bill' : 'Total Invoiced'}
              </span>
              <span className="text-2xl font-extrabold text-slate-900 block">
                ₹{isCustomer ? (firstBill?.total || 0) : calculateGrandTotal()}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isCustomer ? 'Paid Amount' : 'Total Collected'}
              </span>
              <span className="text-2xl font-extrabold text-emerald-600 block">
                ₹{isCustomer ? (firstBill?.totalPaid || 0) : calculateTotalPaid()}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isCustomer ? 'Outstanding Dues' : 'Outstanding Balance'}
              </span>
              <span className={`text-2xl font-extrabold block ${
                (isCustomer ? (firstBill?.remainingAmount || 0) : calculateTotalRemaining()) > 0 
                  ? 'text-amber-600' 
                  : 'text-slate-900'
              }`}>
                ₹{isCustomer 
                  ? (firstBill?.remainingAmount !== undefined ? firstBill.remainingAmount : (firstBill?.total || 0)) 
                  : calculateTotalRemaining()}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${
              (isCustomer ? (firstBill?.remainingAmount || 0) : calculateTotalRemaining()) > 0 
                ? 'bg-amber-50 text-amber-600' 
                : 'bg-slate-50 text-slate-400'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Bill List / Statement */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
            <span className="text-slate-500 font-medium text-sm">Generating your statement...</span>
          </div>
        ) : billing.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-800">No Statements Found</h3>
            <p className="text-slate-500 mt-1 text-sm">There is no billing data available for this selection.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {billing.map((bill, index) => {
              const statusStyle = getPaymentStatusStyle(bill.paymentStatus)
              return (
                <div key={index} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  
                  {/* Bill Card Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-11 w-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mt-1">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xxs font-extrabold text-indigo-600 uppercase tracking-widest block">Customer Details</span>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">{bill.customer.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{bill.customer.phoneNumber}</span>
                          {bill.customer.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{bill.customer.address}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 self-stretch md:self-auto justify-between border-t border-slate-100 md:border-t-0 pt-3 md:pt-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusStyle.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.bg}`}></span>
                        {bill.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Bill Inner Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      {/* Product Breakdown */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Product Breakdown</h4>
                          <span className="text-xs font-medium text-slate-400">Monthly breakdown</span>
                        </div>
                        <div className="space-y-2.5">
                          {Object.keys(bill.productBreakdown || {}).length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl">
                              No product purchases recorded.
                            </div>
                          ) : (
                            Object.entries(bill.productBreakdown || {}).map(([productName, details]) => (
                              <div key={productName} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <span className="text-sm font-bold text-slate-800">{productName}</span>
                                  <span className="text-xs text-slate-500 font-medium block">{details.quantity} units purchased</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-slate-800">₹{details.total}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Purchase History */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Purchase History</h4>
                          <span className="text-xs font-medium text-slate-400">Daily ledger</span>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {!bill.purchases || bill.purchases.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl">
                              No daily ledger entries.
                            </div>
                          ) : (
                            bill.purchases.map((purchase) => (
                              <div key={purchase.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-slate-700">{purchase.product.productName}</span>
                                    <span className="inline-flex items-center text-xxs font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                      {purchase.quantity} units
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-400 font-semibold block">{formatDate(purchase.date)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-slate-800">₹{purchase.quantity * purchase.price}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm">
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}