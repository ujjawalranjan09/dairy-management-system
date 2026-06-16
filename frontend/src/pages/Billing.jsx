import { useState, useEffect } from 'react'
import { billingAPI, customerAPI } from '../services/api'
import {
  Calendar, Search, Clock, CreditCard, Receipt, User, Phone,
  Printer, ChevronDown, ChevronUp
} from 'lucide-react'
import SearchableCustomerSelect from '../components/SearchableCustomerSelect'

export default function Billing({ user }) {
  const isCustomer = user?.role === 'CUSTOMER'
  const [billing, setBilling] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(user?.role === 'EMPLOYEE')
  const [expandedBill, setExpandedBill] = useState(null)

  useEffect(() => { fetchInitialData() }, [])
  useEffect(() => {
    if (isCustomer || customers.length > 0) fetchBilling()
  }, [selectedMonth, selectedYear, selectedCustomer, customers])

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

  const fetchBilling = async () => {
    try {
      setLoading(true)
      setError('')
      if (selectedCustomer) {
        const response = await billingAPI.getCustomer(selectedCustomer, { month: selectedMonth, year: selectedYear })
        setBilling([response.data])
      } else {
        const response = await billingAPI.getMonthly({ month: selectedMonth, year: selectedYear })
        setBilling(response.data.billing || [])
      }
    } catch (err) {
      setError('Could not load bills')
    } finally {
      setLoading(false)
    }
  }

  const calculateGrandTotal = () => billing.reduce((total, bill) => total + bill.total, 0)
  const calculateTotalPaid = () => billing.reduce((total, bill) => total + (bill.totalPaid || 0), 0)
  const calculateTotalRemaining = () => billing.reduce((total, bill) => total + (bill.remainingAmount !== undefined ? bill.remainingAmount : bill.total), 0)

  const getPaymentStatusStyle = (status) => {
    switch (status) {
      case 'PAID': return { badge: 'badge-success', emoji: '✅' }
      case 'PARTIALLY PAID': return { badge: 'badge-info', emoji: '🔄' }
      case 'PENDING': return { badge: 'badge-warning', emoji: '⏳' }
      default: return { badge: 'bg-gray-100 text-gray-600 border border-gray-200', emoji: '❓' }
    }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const handlePrint = (bill) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) { alert('Allow pop-ups to print'); return }
    const billMonthStr = `${months[selectedMonth - 1]} ${selectedYear}`
    const formattedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    const productRows = Object.entries(bill.productBreakdown || {}).map(([productName, details]) => `
      <tr class="item-row"><td>${productName}</td><td class="text-right">${details.quantity}</td><td class="text-right">₹${details.price}</td><td class="text-right">₹${details.total}</td></tr>
    `).join('')
    const ledgerRows = (bill.purchases || []).map(purchase => `
      <tr class="ledger-row"><td>${formatDate(purchase.date)}</td><td>${purchase.product.productName}</td><td>${purchase.shift === 'MORNING' ? '☀️ Morning' : '🌙 Evening'}</td><td class="text-right">${purchase.quantity}</td><td class="text-right">₹${purchase.price}</td><td class="text-right">₹${purchase.quantity * purchase.price}</td></tr>
    `).join('')
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${bill.customer.name}</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');body{font-family:'Inter',sans-serif;color:#1e293b;margin:0;padding:40px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.invoice-card{max-width:800px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;padding:40px;background:#fff}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #f1f5f9;padding-bottom:24px;margin-bottom:24px}.logo-area h1{margin:0;font-size:24px;font-weight:800;color:#0d9488}.logo-area p{margin:4px 0 0;font-size:12px;color:#64748b;font-weight:500}.invoice-meta{text-align:right}.invoice-meta h2{margin:0;font-size:20px;font-weight:700;color:#0f172a}.invoice-meta p{margin:4px 0 0;font-size:12px;color:#64748b;font-weight:500}.details-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px}.section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#0d9488;margin:0 0 8px}.details-box p{margin:4px 0;font-size:14px;line-height:1.5}.details-box .name{font-weight:700;color:#0f172a;font-size:16px}.badge{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:700;text-transform:uppercase;margin-top:8px}.badge-paid{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}.badge-partially-paid{background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd}.badge-pending{background:#fffbeb;color:#b45309;border:1px solid #fde68a}.metrics-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;background:#f8fafc;border:1px solid #f1f5f9;border-radius:12px;padding:16px;margin-bottom:32px}.metric-card{text-align:center}.metric-label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em}.metric-value{font-size:20px;font-weight:800;color:#0f172a;margin-top:4px}.metric-value.highlight{color:#059669}.metric-value.warning{color:#d97706}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{text-align:left;padding:10px 12px;background:#f8fafc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;border-bottom:1px solid #e2e8f0}td{padding:10px 12px;font-size:13px;border-bottom:1px solid #f1f5f9}.text-right{text-align:right}.footer{text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px}@media print{body{padding:20px}.invoice-card{border:none;padding:0}}</style>
    </head><body><div class="invoice-card"><div class="header"><div class="logo-area"><h1>🥛 My Dairy Shop</h1><p>Fresh & Quality Dairy</p></div><div class="invoice-meta"><h2>INVOICE</h2><p>Period: ${billMonthStr}</p><p>Generated: ${formattedDate}</p></div></div>
    <div class="details-grid"><div class="details-box"><h3 class="section-title">Billed To</h3><p class="name">${bill.customer.name}</p><p>Phone: ${bill.customer.phoneNumber}</p>${bill.customer.address ? `<p>Address: ${bill.customer.address}</p>` : ''}</div><div class="details-box text-right"><h3 class="section-title">Payment Status</h3><div><span class="badge badge-${bill.paymentStatus.toLowerCase().replace(' ', '-')}">${bill.paymentStatus}</span></div></div></div>
    <div class="metrics-row"><div class="metric-card"><div class="metric-label">Total</div><div class="metric-value">₹${bill.total}</div></div><div class="metric-card"><div class="metric-label">Paid</div><div class="metric-value highlight">₹${bill.totalPaid || 0}</div></div><div class="metric-card"><div class="metric-label">Outstanding</div><div class="metric-value ${bill.remainingAmount > 0 ? 'warning' : ''}">₹${bill.remainingAmount !== undefined ? bill.remainingAmount : bill.total}</div></div></div>
    <h3 class="section-title">Product Summary</h3><table><thead><tr><th>Product</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th></tr></thead><tbody>${productRows}</tbody></table>
    <h3 class="section-title" style="margin-top:40px">Daily Ledger</h3><table><thead><tr><th>Date</th><th>Product</th><th>Shift</th><th class="text-right">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th></tr></thead><tbody>${ledgerRows}</tbody></table>
    <div class="footer"><p>Thank you for choosing My Dairy Shop!</p></div></div>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script></body></html>`)
    printWindow.document.close()
  }

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const firstBill = billing[0] || null

  const displayCustomers = user?.role === 'EMPLOYEE' && showOnlyAssigned
    ? customers.filter(c => c.assignedEmployeeId === user.id)
    : customers

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="page-title">{isCustomer ? '🧾 My Bills' : '🧾 Bills'}</h1>
        <p className="page-subtitle">{isCustomer ? 'Your monthly dairy bills' : 'View and print monthly bills'}</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end">
          <div className="col-span-2 md:col-span-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">📅 Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="select text-base py-3 min-h-[52px]">
              {months.map((month, index) => <option key={index} value={index + 1}>{month}</option>)}
            </select>
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="select text-base py-3 min-h-[52px]">
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          {!isCustomer && (
            <div className="col-span-2 md:col-span-4">
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
          <div className={`col-span-2 ${isCustomer ? 'md:col-span-7' : 'md:col-span-3'}`}>
            <button onClick={fetchBilling} className="btn-primary w-full h-12 active:scale-95">
              <Search className="w-4 h-4 mr-1.5" />
              Show Bills
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {!loading && billing.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="text-lg mb-1">🧾</div>
            <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
            <p className="text-base font-extrabold text-gray-900 mt-0.5">₹{isCustomer ? (firstBill?.total || 0) : calculateGrandTotal()}</p>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg mb-1">✅</div>
            <p className="text-xs font-bold text-gray-400 uppercase">Paid</p>
            <p className="text-base font-extrabold text-emerald-600 mt-0.5">₹{isCustomer ? (firstBill?.totalPaid || 0) : calculateTotalPaid()}</p>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg mb-1">⏳</div>
            <p className="text-xs font-bold text-gray-400 uppercase">Due</p>
            <p className={`text-base font-extrabold mt-0.5 ${(isCustomer ? (firstBill?.remainingAmount || 0) : calculateTotalRemaining()) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              ₹{isCustomer ? (firstBill?.remainingAmount !== undefined ? firstBill.remainingAmount : (firstBill?.total || 0)) : calculateTotalRemaining()}
            </p>
          </div>
        </div>
      )}

      {/* Bills */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="text-4xl animate-bounce mb-3">🥛</div>
          <span className="text-gray-400 text-sm font-medium">Loading bills...</span>
        </div>
      ) : billing.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">🧾</div>
          <h3 className="text-sm font-bold text-gray-700">No Bills Found</h3>
          <p className="text-gray-400 mt-1 text-xs">No billing data for this selection.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {billing.map((bill, index) => {
            const statusStyle = getPaymentStatusStyle(bill.paymentStatus)
            const isExpanded = expandedBill === index
            return (
              <div key={index} className="card overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                <button
                  onClick={() => setExpandedBill(isExpanded ? null : index)}
                  className="w-full p-4 text-left min-h-[56px] active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center text-lg flex-shrink-0">
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-base truncate">{bill.customer.name}</p>
                        <span className={`${statusStyle.badge} flex-shrink-0`}>
                          {statusStyle.emoji} {bill.paymentStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />{bill.customer.phoneNumber}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">₹{bill.total}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4 animate-slide-down">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                        <p className="text-sm font-extrabold text-gray-900">₹{bill.total}</p>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 rounded-2xl">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">Paid</p>
                        <p className="text-sm font-extrabold text-emerald-600">₹{bill.totalPaid || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-2xl">
                        <p className="text-[10px] text-amber-600 font-bold uppercase">Due</p>
                        <p className="text-sm font-extrabold text-amber-600">₹{bill.remainingAmount !== undefined ? bill.remainingAmount : bill.total}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📦 Products</h4>
                      <div className="space-y-1.5">
                        {Object.keys(bill.productBreakdown || {}).length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-3">No products recorded</p>
                        ) : (
                          Object.entries(bill.productBreakdown || {}).map(([productName, details]) => (
                            <div key={productName} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl text-sm">
                              <div>
                                <span className="font-semibold text-gray-800">{productName}</span>
                                <span className="text-xs text-gray-400 ml-1.5">{details.quantity} units</span>
                              </div>
                              <span className="font-bold text-gray-900">₹{details.total}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {bill.purchases && bill.purchases.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📋 Daily Ledger</h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                          {bill.purchases.map((purchase) => (
                            <div key={purchase.id} className="flex justify-between items-center p-2.5 active:bg-gray-50 rounded-xl text-sm transition-colors">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-gray-800 text-xs">{purchase.product.productName}</span>
                                  <span className="text-xs text-gray-400 font-medium">{purchase.quantity}u</span>
                                  {purchase.shift && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      purchase.shift === 'MORNING' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'
                                    }`}>
                                      {purchase.shift === 'MORNING' ? '☀️ AM' : '🌙 PM'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 font-semibold">{formatDate(purchase.date)}</span>
                              </div>
                              <span className="font-bold text-gray-900 text-xs">₹{purchase.quantity * purchase.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button onClick={() => handlePrint(bill)} className="btn-secondary w-full h-12 active:scale-95">
                      <Printer className="w-4 h-4 mr-1.5" />
                      🖨️ Print / Save PDF
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
