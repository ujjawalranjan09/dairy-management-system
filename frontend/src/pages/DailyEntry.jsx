import { useState, useEffect } from 'react'
import { customerAPI, productAPI, purchaseAPI, paymentAPI } from '../services/api'
import { Plus, Minus, Save, PlusCircle, Trash2 } from 'lucide-react'
import SearchableCustomerSelect from '../components/SearchableCustomerSelect'
import SearchableProductSelect from '../components/SearchableProductSelect'

function getUnitOptions(baseUnit) {
  const base = (baseUnit || '').toLowerCase()
  if (base === 'kg' || base === 'g') return [{ label: 'kg', value: 'kg' }, { label: 'g', value: 'g' }]
  if (base === 'l' || base === 'ml' || base === 'liter' || base === 'litre') return [{ label: 'L', value: 'L' }, { label: 'ml', value: 'ml' }]
  return [{ label: baseUnit || 'unit', value: baseUnit || 'unit' }]
}

function defaultUnit(baseUnit) {
  const base = (baseUnit || '').toLowerCase()
  if (base === 'kg' || base === 'g') return 'kg'
  if (base === 'l' || base === 'ml' || base === 'liter' || base === 'litre') return 'L'
  return baseUnit || 'unit'
}

function toBaseQty(qty, enteredUnit, baseUnit) {
  const num = parseFloat(qty) || 0
  const eu = (enteredUnit || '').toLowerCase()
  const bu = (baseUnit || '').toLowerCase()
  if (bu === 'kg') return eu === 'g' ? num / 1000 : num
  if (bu === 'g') return eu === 'kg' ? num * 1000 : num
  if (bu === 'l' || bu === 'liter' || bu === 'litre') return eu === 'ml' ? num / 1000 : num
  if (bu === 'ml') return (eu === 'l' || eu === 'liter' || eu === 'litre') ? num * 1000 : num
  return num
}

function rowPrice(price, qty, enteredUnit, baseUnit) {
  return price * toBaseQty(qty, enteredUnit, baseUnit)
}

export default function DailyEntry({ user }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(user?.role === 'EMPLOYEE')
  const [selectedShift, setSelectedShift] = useState('MORNING')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [purchases, setPurchases] = useState([{ productId: '', quantity: 1, unit: 'kg' }])

  useEffect(() => { fetchInitialData() }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [cr, pr] = await Promise.all([customerAPI.getAll(), productAPI.getAll()])
      setCustomers(cr.data.customers)
      setProducts(pr.data.products)
    } catch (err) {
      setError('Could not load data')
    } finally {
      setLoading(false)
    }
  }

  const getProduct = (id) => products.find(p => p.id === parseInt(id))
  const getProductPrice = (id) => getProduct(id)?.price ?? 0
  const getProductUnit = (id) => getProduct(id)?.unit ?? ''

  const addPurchase = () => setPurchases([...purchases, { productId: '', quantity: 1, unit: 'kg' }])
  const removePurchase = (index) => { if (purchases.length > 1) setPurchases(purchases.filter((_, i) => i !== index)) }

  const updatePurchase = (index, field, value) => {
    const next = [...purchases]
    next[index] = { ...next[index], [field]: value }
    if (field === 'productId') {
      const prod = products.find(p => p.id === parseInt(value))
      next[index].unit = prod ? defaultUnit(prod.unit) : 'kg'
      next[index].quantity = 1
    }
    setPurchases(next)
  }

  const calculateTotal = () =>
    purchases.reduce((total, p) => {
      if (p.productId && p.quantity > 0) {
        return total + rowPrice(getProductPrice(p.productId), p.quantity, p.unit, getProductUnit(p.productId))
      }
      return total
    }, 0)

  const handleSubmit = async (e, payHandToHand = false) => {
    if (e) e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedCustomer) { setError('Please select a customer'); return }
    const validPurchases = purchases.filter(p => p.productId && p.quantity > 0)
    if (validPurchases.length === 0) { setError('Add at least one product'); return }

    try {
      setLoading(true)
      const purchasePromises = validPurchases.map(p =>
        purchaseAPI.create({
          customerId: parseInt(selectedCustomer),
          productId: parseInt(p.productId),
          quantity: toBaseQty(p.quantity, p.unit, getProductUnit(p.productId)),
          date: selectedDate,
          shift: selectedShift,
        })
      )
      await Promise.all(purchasePromises)

      if (payHandToHand) {
        try {
          const totalAmount = calculateTotal()
          const dateObj = new Date(selectedDate)
          const payRes = await paymentAPI.create({
            customerId: parseInt(selectedCustomer),
            amount: parseFloat(totalAmount),
            month: dateObj.getMonth() + 1,
            year: dateObj.getFullYear(),
            method: 'CASH'
          })
          if (payRes.data?.payment?.id) await paymentAPI.markAsPaid(payRes.data.payment.id)
        } catch (paymentErr) {
          console.error('Payment recording failed:', paymentErr)
        }
      }

      setSuccess(payHandToHand ? '✅ Saved & cash payment recorded!' : '✅ Purchases saved!')
      setPurchases([{ productId: '', quantity: 1, unit: 'kg' }])
      setSelectedCustomer('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayCustomers = user?.role === 'EMPLOYEE' && showOnlyAssigned
    ? customers.filter(c => c.assignedEmployeeId === user.id)
    : customers

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-4xl animate-bounce">🥛</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-32 md:pb-4">
      <div>
        <h1 className="page-title">📝 Daily Entry</h1>
        <p className="page-subtitle">Record what your customers bought today</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4 md:p-6 space-y-4">
          {/* Customer */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700">👤 Who's buying? *</label>
              {user?.role === 'EMPLOYEE' && (
                <label className="inline-flex items-center text-xs text-brand-600 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyAssigned}
                    onChange={(e) => setShowOnlyAssigned(e.target.checked)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 mr-1.5 h-4 w-4"
                  />
                  My customers only
                </label>
              )}
            </div>
            <SearchableCustomerSelect
              customers={displayCustomers}
              value={selectedCustomer}
              onChange={(customerId) => {
                setSelectedCustomer(customerId)
                if (customerId) {
                  const cust = customers.find(c => c.id === parseInt(customerId))
                  if (cust?.defaultProducts?.length > 0) {
                    setPurchases(cust.defaultProducts.map(dp => ({
                      productId: String(dp.productId),
                      quantity: dp.quantity || 1,
                      unit: dp.unit
                    })))
                  } else {
                    setPurchases([{ productId: '', quantity: 1, unit: '' }])
                  }
                }
              }}
              placeholder="Search customer name or phone..."
              required={true}
            />
          </div>

          {/* Date + Shift */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">📅 Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input text-base py-3 min-h-[52px]"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">⏰ Time</label>
              <div className="flex bg-gray-100 p-1 rounded-2xl h-[52px]">
                <button
                  type="button"
                  onClick={() => setSelectedShift('MORNING')}
                  className={`flex-1 flex items-center justify-center gap-1 text-sm font-semibold rounded-xl transition-all active:scale-95 ${
                    selectedShift === 'MORNING' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  ☀️ Morning
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShift('EVENING')}
                  className={`flex-1 flex items-center justify-center gap-1 text-sm font-semibold rounded-xl transition-all active:scale-95 ${
                    selectedShift === 'EVENING' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🌙 Evening
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="card p-4 md:p-6">
          <label className="text-sm font-semibold text-gray-700 mb-3 block">🥛 What did they buy?</label>
          <div className="space-y-3">
            {purchases.map((purchase, index) => {
              const prod = getProduct(purchase.productId)
              const baseUnit = prod?.unit ?? ''
              const unitOpts = prod ? getUnitOptions(baseUnit) : [{ label: 'kg', value: 'kg' }, { label: 'g', value: 'g' }, { label: 'L', value: 'L' }, { label: 'ml', value: 'ml' }]
              const price = getProductPrice(purchase.productId)
              const lineTotal = rowPrice(price, purchase.quantity, purchase.unit, baseUnit)

              return (
                <div key={index} className="bg-gray-50 rounded-2xl p-4 space-y-3 animate-slide-up">
                  {/* Product select */}
                  <div>
                    <label className="text-xs text-gray-500 font-semibold uppercase mb-1.5 block">Product *</label>
                    <SearchableProductSelect
                      products={products}
                      value={purchase.productId}
                      onChange={(val) => updatePurchase(index, 'productId', val)}
                      placeholder="Search product..."
                      required
                    />
                  </div>

                  {/* Mobile: stacked */}
                  <div className="md:hidden space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-semibold uppercase mb-1.5 block">
                        How much? {prod && <span className="text-brand-500 normal-case">(₹{price}/{prod.unit})</span>}
                      </label>
                      <div className="flex items-center border border-gray-200 rounded-2xl overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => updatePurchase(index, 'quantity', Math.max(0.001, parseFloat(purchase.quantity) - 1))}
                          className="px-4 py-3.5 text-gray-500 active:bg-gray-100 min-h-[52px] min-w-[52px] flex items-center justify-center"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={purchase.quantity}
                          onChange={(e) => updatePurchase(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="flex-1 px-2 py-3.5 border-0 focus:outline-none text-center text-lg font-bold min-h-[52px]"
                          min="0"
                          step="0.001"
                        />
                        <button
                          type="button"
                          onClick={() => updatePurchase(index, 'quantity', parseFloat(purchase.quantity) + 1)}
                          className="px-4 py-3.5 text-gray-500 active:bg-gray-100 min-h-[52px] min-w-[52px] flex items-center justify-center"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1.5 block">Unit</label>
                        <select
                          value={purchase.unit}
                          onChange={(e) => updatePurchase(index, 'unit', e.target.value)}
                          className="select text-base py-3 min-h-[52px]"
                        >
                          {unitOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="flex-shrink-0">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1.5 block">Price</label>
                        <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 text-lg min-h-[52px] flex items-center">
                          ₹{lineTotal.toFixed(2)}
                        </div>
                      </div>
                      {purchases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePurchase(index)}
                          className="p-3 text-rose-500 active:bg-rose-50 rounded-xl transition-colors min-h-[52px] min-w-[52px] flex items-center justify-center"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop: horizontal */}
                  <div className="hidden md:flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 font-semibold uppercase mb-1 block">
                        Qty {prod && <span className="text-brand-500 normal-case">(₹{price}/{prod.unit})</span>}
                      </label>
                      <div className="flex items-center border border-gray-200 rounded-2xl overflow-hidden bg-white">
                        <button type="button" onClick={() => updatePurchase(index, 'quantity', Math.max(0.001, parseFloat(purchase.quantity) - 1))} className="px-3 py-2.5 text-gray-500 hover:bg-gray-50 touch-target">
                          <Minus className="w-4 h-4" />
                        </button>
                        <input type="number" value={purchase.quantity} onChange={(e) => updatePurchase(index, 'quantity', parseFloat(e.target.value) || 0)} className="w-16 px-1 py-2.5 border-0 focus:outline-none text-center text-sm font-semibold" min="0" step="0.001" />
                        <button type="button" onClick={() => updatePurchase(index, 'quantity', parseFloat(purchase.quantity) + 1)} className="px-3 py-2.5 text-gray-500 hover:bg-gray-50 touch-target">
                          <Plus className="w-4 h-4" />
                        </button>
                        <select value={purchase.unit} onChange={(e) => updatePurchase(index, 'unit', e.target.value)} className="border-l border-gray-200 px-2 py-2.5 bg-brand-50 text-brand-700 font-semibold focus:outline-none text-xs">
                          {unitOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <label className="text-[10px] text-gray-500 font-semibold uppercase mb-1 block">Price</label>
                      <div className="px-3 py-2.5 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 text-sm min-w-[70px] text-center">
                        ₹{lineTotal.toFixed(2)}
                      </div>
                    </div>
                    {purchases.length > 1 && (
                      <button type="button" onClick={() => removePurchase(index)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors touch-target">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button type="button" onClick={addPurchase} className="mt-4 flex items-center gap-2 text-brand-600 active:text-brand-800 text-sm font-semibold min-h-[48px]">
            <PlusCircle className="w-5 h-5" />
            Add Another Product
          </button>
        </div>
      </form>

      {/* Sticky bottom bar - mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="bg-white border-t border-gray-200 shadow-bottom-nav">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-bold text-gray-700">Total</span>
              <span className="text-3xl font-extrabold text-brand-600">₹{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="btn-success flex-1 h-14 text-base active:scale-95"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  '💵 Cash Paid'
                )}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
                className="btn-primary flex-1 h-14 text-base active:scale-95"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-1.5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: inline */}
      <div className="hidden md:block space-y-4">
        <div className="card p-4 md:p-6 bg-gradient-to-r from-brand-50 to-emerald-50 border-brand-100">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-700">Total Amount</span>
            <span className="text-3xl font-extrabold text-brand-600">₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="btn-success flex-1 h-12">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '💵 Cash Paid'}
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 h-12">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save className="w-4 h-4 mr-1.5" />Save</>}
          </button>
        </div>
      </div>
    </div>
  )
}
