import { useState, useEffect } from 'react'
import { stockAPI, productAPI } from '../services/api'

export default function Stock({ user }) {
  const [stock, setStock] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState(null)

  useEffect(() => { fetchData() }, [])
  useEffect(() => { fetchStock() }, [selectedDate])

  const fetchData = async () => {
    try {
      const res = await productAPI.getAll()
      setProducts(res.data.products || [])
    } catch (err) {
      setError('Could not load products')
    }
  }

  const fetchStock = async () => {
    try {
      setLoading(true)
      const res = await stockAPI.get({ date: selectedDate })
      const stockData = res.data.stock || []

      // Merge with products to ensure all products have entries
      const merged = products.map(p => {
        const existing = stockData.find(s => s.productId === p.id)
        return existing || {
          productId: p.id,
          product: p,
          openingQty: 0,
          receivedQty: 0,
          soldQty: 0,
          wastedQty: 0,
          closingQty: 0
        }
      })

      setEntries(merged.length > 0 ? merged : stockData)
      setStock(stockData)
    } catch (err) {
      setError('Could not load stock data')
    } finally {
      setLoading(false)
    }
  }

  const updateEntry = (index, field, value) => {
    const next = [...entries]
    next[index] = { ...next[index], [field]: parseFloat(value) || 0 }
    // Auto-calculate closing
    const e = next[index]
    e.closingQty = (e.openingQty || 0) + (e.receivedQty || 0) - (e.soldQty || 0) - (e.wastedQty || 0)
    setEntries(next)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const validEntries = entries.filter(e => e.productId).map(e => ({
        productId: e.productId,
        openingQty: e.openingQty || 0,
        receivedQty: e.receivedQty || 0,
        soldQty: e.soldQty || 0,
        wastedQty: e.wastedQty || 0
      }))
      await stockAPI.save({ date: selectedDate, entries: validEntries })
      setSuccess('✅ Stock saved!')
      fetchStock()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Could not save stock')
    } finally {
      setSaving(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const res = await stockAPI.getSummary({})
      setSummary(res.data)
      setShowSummary(true)
    } catch (err) {
      setError('Could not load summary')
    }
  }

  return (
    <div className="space-y-4 pb-32 md:pb-4">
      <div>
        <h1 className="page-title">📦 Stock / Inventory</h1>
        <p className="page-subtitle">Track milk supply, sales, and wastage</p>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">⚠️ {error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-medium">{success}</div>}

      {/* Date + Actions */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">📅 Date:</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input text-base py-3 min-h-[48px] max-w-[170px]" />
          {selectedDate !== new Date().toISOString().split('T')[0] && (
            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="text-xs text-brand-600 font-bold">Today</button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSummary} className="btn-secondary h-10 px-4 text-xs">📊 Summary</button>
        </div>
      </div>

      {/* Stock Entry Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="text-4xl animate-bounce">🥛</div></div>
      ) : entries.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-gray-500 font-medium text-sm">No products found. Add products first.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {entries.map((entry, i) => {
              const product = entry.product || products.find(p => p.id === entry.productId)
              return (
                <div key={i} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🥛</span>
                    <span className="font-bold text-gray-900">{product?.productName || 'Product'}</span>
                    <span className="text-xs text-gray-400">({product?.unit})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">📥 Opening</label>
                      <input type="number" inputMode="decimal" value={entry.openingQty || ''} onChange={(e) => updateEntry(i, 'openingQty', e.target.value)} className="input text-base py-2.5 min-h-[44px]" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">📦 Received</label>
                      <input type="number" inputMode="decimal" value={entry.receivedQty || ''} onChange={(e) => updateEntry(i, 'receivedQty', e.target.value)} className="input text-base py-2.5 min-h-[44px]" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">🛒 Sold</label>
                      <input type="number" inputMode="decimal" value={entry.soldQty || ''} onChange={(e) => updateEntry(i, 'soldQty', e.target.value)} className="input text-base py-2.5 min-h-[44px]" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">🗑️ Wasted</label>
                      <input type="number" inputMode="decimal" value={entry.wastedQty || ''} onChange={(e) => updateEntry(i, 'wastedQty', e.target.value)} className="input text-base py-2.5 min-h-[44px]" placeholder="0" />
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-brand-50 rounded-xl text-center">
                    <span className="text-xs text-brand-600 font-semibold">📊 Closing Stock: </span>
                    <span className="text-lg font-extrabold text-brand-700">{(entry.closingQty || 0).toFixed(1)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Product</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Opening</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Received</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Sold</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Wasted</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-brand-600 uppercase">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const product = entry.product || products.find(p => p.id === entry.productId)
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-sm">{product?.productName || 'Product'}</td>
                        <td className="px-2 py-2"><input type="number" inputMode="decimal" value={entry.openingQty || ''} onChange={(e) => updateEntry(i, 'openingQty', e.target.value)} className="w-20 px-2 py-2 border border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="0" /></td>
                        <td className="px-2 py-2"><input type="number" inputMode="decimal" value={entry.receivedQty || ''} onChange={(e) => updateEntry(i, 'receivedQty', e.target.value)} className="w-20 px-2 py-2 border border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="0" /></td>
                        <td className="px-2 py-2"><input type="number" inputMode="decimal" value={entry.soldQty || ''} onChange={(e) => updateEntry(i, 'soldQty', e.target.value)} className="w-20 px-2 py-2 border border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="0" /></td>
                        <td className="px-2 py-2"><input type="number" inputMode="decimal" value={entry.wastedQty || ''} onChange={(e) => updateEntry(i, 'wastedQty', e.target.value)} className="w-20 px-2 py-2 border border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="0" /></td>
                        <td className="px-4 py-3 text-center font-extrabold text-brand-600">{(entry.closingQty || 0).toFixed(1)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Summary Modal */}
      {showSummary && summary && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowSummary(false)}></div>
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">📊 Stock Summary</h2>
              <button onClick={() => setShowSummary(false)} className="p-2 text-gray-400 active:bg-gray-100 rounded-xl">✕</button>
            </div>
            {summary.summary && summary.summary.length > 0 ? (
              <div className="space-y-3">
                {summary.summary.map((item, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl">
                    <div className="font-semibold text-gray-900 mb-2">🥛 {item.product.productName}</div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div><div className="text-[10px] text-gray-400 font-bold uppercase">Received</div><div className="font-bold text-sm">{item.totalReceived.toFixed(1)}</div></div>
                      <div><div className="text-[10px] text-gray-400 font-bold uppercase">Sold</div><div className="font-bold text-sm">{item.totalSold.toFixed(1)}</div></div>
                      <div><div className="text-[10px] text-gray-400 font-bold uppercase">Wasted</div><div className="font-bold text-sm text-rose-500">{item.totalWasted.toFixed(1)}</div></div>
                      <div><div className="text-[10px] text-brand-600 font-bold uppercase">Closing</div><div className="font-extrabold text-brand-600">{item.latestClosing.toFixed(1)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8"><div className="text-4xl mb-2">📦</div><p className="text-gray-400">No stock data yet</p></div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Save Button - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="bg-white border-t border-gray-200 shadow-bottom-nav px-4 py-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full h-14 text-base">
            {saving ? 'Saving...' : '💾 Save Stock'}
          </button>
        </div>
      </div>

      {/* Desktop Save */}
      <div className="hidden md:block">
        <button onClick={handleSave} disabled={saving} className="btn-primary h-12 px-8">
          {saving ? 'Saving...' : '💾 Save Stock'}
        </button>
      </div>
    </div>
  )
}
