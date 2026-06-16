import { useState, useEffect } from 'react'
import { agingAPI, whatsappAPI } from '../services/api'

export default function Outstanding({ user }) {
  const [report, setReport] = useState([])
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expandedCustomer, setExpandedCustomer] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => { fetchReport() }, [])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await agingAPI.getReport()
      setReport(res.data.report || [])
      setTotals(res.data.totals)
    } catch (err) {
      setError('Could not load report')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminders = async () => {
    try {
      setSending(true)
      const res = await whatsappAPI.sendReminders()
      setSuccess(`✅ ${res.data.message}`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Could not send reminders')
    } finally {
      setSending(false)
    }
  }

  const formatCurrency = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="page-title">📋 Outstanding Report</h1>
          <p className="page-subtitle">Who owes you money and how old is the debt</p>
        </div>
        <button onClick={handleSendReminders} disabled={sending || report.length === 0} className="btn-primary h-12 flex-shrink-0 active:scale-95">
          {sending ? 'Sending...' : '📱 Send Reminders'}
        </button>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">⚠️ {error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-medium">{success}</div>}

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card p-4 col-span-2 md:col-span-1">
            <div className="text-2xl mb-1">👥</div>
            <p className="text-xs font-bold text-gray-400 uppercase">Customers Due</p>
            <p className="text-xl font-extrabold text-gray-900">{totals.totalCustomers}</p>
          </div>
          <div className="card p-4">
            <div className="text-2xl mb-1">💰</div>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Outstanding</p>
            <p className="text-xl font-extrabold text-rose-600">{formatCurrency(totals.totalOutstanding)}</p>
          </div>
          <div className="card p-4">
            <div className="text-2xl mb-1">🟢</div>
            <p className="text-xs font-bold text-gray-400 uppercase">0-30 Days</p>
            <p className="text-xl font-extrabold text-emerald-600">{formatCurrency(totals.bucket0to30)}</p>
          </div>
          <div className="card p-4">
            <div className="text-2xl mb-1">🟡</div>
            <p className="text-xs font-bold text-gray-400 uppercase">31-60 Days</p>
            <p className="text-xl font-extrabold text-amber-600">{formatCurrency(totals.bucket31to60)}</p>
          </div>
          <div className="card p-4">
            <div className="text-2xl mb-1">🔴</div>
            <p className="text-xs font-bold text-gray-400 uppercase">60+ Days</p>
            <p className="text-xl font-extrabold text-rose-600">{formatCurrency(totals.bucket61to90 + totals.bucket90plus)}</p>
          </div>
        </div>
      )}

      {/* Customer List */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="text-4xl animate-bounce">🥛</div></div>
      ) : report.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-gray-900">All Clear!</h3>
          <p className="text-gray-400 text-sm mt-1">No outstanding payments. Everyone has paid!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {report.map((item, i) => {
            const isExpanded = expandedCustomer === i
            const { customer, totalOutstanding, aging } = item
            // Determine severity
            const severity = aging['90+'].amount > 0 ? 'critical' : aging['61-90'].amount > 0 ? 'high' : aging['31-60'].amount > 0 ? 'medium' : 'low'
            const severityColors = {
              critical: 'border-l-4 border-rose-500',
              high: 'border-l-4 border-orange-500',
              medium: 'border-l-4 border-amber-500',
              low: 'border-l-4 border-emerald-500'
            }

            return (
              <div key={i} className={`card overflow-hidden animate-slide-up ${severityColors[severity]}`} style={{ animationDelay: `${i * 20}ms` }}>
                <button onClick={() => setExpandedCustomer(isExpanded ? null : i)} className="w-full p-4 text-left active:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-2xl flex items-center justify-center font-bold text-base flex-shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base truncate">{customer.name}</p>
                      <p className="text-xs text-gray-400">📱 {customer.phoneNumber}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-extrabold text-rose-600">{formatCurrency(totalOutstanding)}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">OUTSTANDING</p>
                    </div>
                  </div>

                  {/* Aging Bar */}
                  <div className="mt-3 flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                    {aging['0-30'].amount > 0 && <div className="bg-emerald-500 rounded-full" style={{ width: `${(aging['0-30'].amount / totalOutstanding) * 100}%` }}></div>}
                    {aging['31-60'].amount > 0 && <div className="bg-amber-500 rounded-full" style={{ width: `${(aging['31-60'].amount / totalOutstanding) * 100}%` }}></div>}
                    {aging['61-90'].amount > 0 && <div className="bg-orange-500 rounded-full" style={{ width: `${(aging['61-90'].amount / totalOutstanding) * 100}%` }}></div>}
                    {aging['90+'].amount > 0 && <div className="bg-rose-500 rounded-full" style={{ width: `${(aging['90+'].amount / totalOutstanding) * 100}%` }}></div>}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-3 animate-slide-down">
                    {/* Aging Buckets */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center p-3 bg-emerald-50 rounded-xl">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">0-30</p>
                        <p className="text-sm font-extrabold text-emerald-600">{formatCurrency(aging['0-30'].amount)}</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-xl">
                        <p className="text-[10px] text-amber-600 font-bold uppercase">31-60</p>
                        <p className="text-sm font-extrabold text-amber-600">{formatCurrency(aging['31-60'].amount)}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-[10px] text-orange-600 font-bold uppercase">61-90</p>
                        <p className="text-sm font-extrabold text-orange-600">{formatCurrency(aging['61-90'].amount)}</p>
                      </div>
                      <div className="text-center p-3 bg-rose-50 rounded-xl">
                        <p className="text-[10px] text-rose-600 font-bold uppercase">90+</p>
                        <p className="text-sm font-extrabold text-rose-600">{formatCurrency(aging['90+'].amount)}</p>
                      </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📅 Monthly Breakdown</h4>
                      <div className="space-y-1.5">
                        {item.monthlyBreakdown.map((m, j) => (
                          <div key={j} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl text-sm">
                            <span className="font-medium text-gray-700">{m.month}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-400">Bill: ₹{Math.round(m.purchased)}</span>
                              <span className="text-xs text-emerald-500">Paid: ₹{Math.round(m.paid)}</span>
                              <span className="font-bold text-rose-600">Due: ₹{Math.round(m.due)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Total Bill</p>
                        <p className="font-bold text-gray-900">{formatCurrency(item.totalPurchases)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Paid</p>
                        <p className="font-bold text-emerald-600">{formatCurrency(item.totalPaid)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Advance</p>
                        <p className="font-bold text-brand-600">{formatCurrency(item.totalAdvance)}</p>
                      </div>
                    </div>
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
