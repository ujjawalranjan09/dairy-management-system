import { useState } from 'react'
import { whatsappAPI, customerAPI } from '../services/api'
import { useEffect } from 'react'
import SearchableCustomerSelect from '../components/SearchableCustomerSelect'

export default function WhatsApp({ user }) {
  const [sending, setSending] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [billMonth, setBillMonth] = useState(new Date().getMonth() + 1)
  const [billYear, setBillYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await customerAPI.getAll()
        setCustomers(res.data.customers || [])
      } catch (err) { console.error(err) }
    }
    fetch()
  }, [])

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i)

  const handleAction = async (action, label) => {
    try {
      setSending(label)
      setError('')
      setSuccess('')
      let res
      if (action === 'daily') {
        res = await whatsappAPI.sendDailySummary()
      } else if (action === 'reminders') {
        res = await whatsappAPI.sendReminders()
      } else if (action === 'bill') {
        if (!selectedCustomer) { setError('Please select a customer'); setSending(''); return }
        res = await whatsappAPI.sendMonthlyBill({ customerId: parseInt(selectedCustomer), month: billMonth, year: billYear })
      }
      setSuccess(`✅ ${res.data.message || 'Sent successfully!'}`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send')
    } finally {
      setSending('')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">📱 WhatsApp</h1>
        <p className="page-subtitle">Send messages and bills to customers via WhatsApp</p>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">⚠️ {error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-medium">{success}</div>}

      {/* Info Banner */}
      <div className="card p-4 bg-brand-50 border-brand-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-bold text-brand-800 text-sm">How WhatsApp Works</h3>
            <p className="text-xs text-brand-600 mt-1">
              Messages are sent using the WhatsApp Business API. If the API is not configured, messages will be logged to the console (simulated mode).
              Configure WHATSAPP_API_URL, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_ACCESS_TOKEN in your backend .env to enable real messaging.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="card p-4 md:p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">📋</span>
          <div>
            <h2 className="font-bold text-gray-900 text-base">Daily Purchase Summary</h2>
            <p className="text-xs text-gray-400">Send today's purchases to all customers</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Sends a WhatsApp message to each customer who made a purchase today, showing their items and total.
        </p>
        <button
          onClick={() => handleAction('daily', 'daily')}
          disabled={!!sending}
          className="btn-primary h-12 w-full sm:w-auto"
        >
          {sending === 'daily' ? '📤 Sending...' : '📤 Send Daily Summary'}
        </button>
      </div>

      {/* Payment Reminders */}
      <div className="card p-4 md:p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⏰</span>
          <div>
            <h2 className="font-bold text-gray-900 text-base">Payment Reminders</h2>
            <p className="text-xs text-gray-400">Remind customers with pending payments</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Sends a reminder message to all customers who have pending/unpaid bills.
        </p>
        <button
          onClick={() => handleAction('reminders', 'reminders')}
          disabled={!!sending}
          className="btn-primary h-12 w-full sm:w-auto"
        >
          {sending === 'reminders' ? '📤 Sending...' : '⏰ Send Reminders'}
        </button>
      </div>

      {/* Monthly Bill */}
      <div className="card p-4 md:p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🧾</span>
          <div>
            <h2 className="font-bold text-gray-900 text-base">Send Monthly Bill</h2>
            <p className="text-xs text-gray-400">Send a detailed bill to a specific customer</p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">👤 Customer</label>
            <SearchableCustomerSelect
              customers={customers}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              placeholder="Select customer..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">📅 Month</label>
              <select value={billMonth} onChange={(e) => setBillMonth(parseInt(e.target.value))} className="select text-base py-3 min-h-[48px]">
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Year</label>
              <select value={billYear} onChange={(e) => setBillYear(parseInt(e.target.value))} className="select text-base py-3 min-h-[48px]">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <button
          onClick={() => handleAction('bill', 'bill')}
          disabled={!!sending}
          className="btn-primary h-12 w-full sm:w-auto"
        >
          {sending === 'bill' ? '📤 Sending...' : '🧾 Send Bill'}
        </button>
      </div>
    </div>
  )
}
