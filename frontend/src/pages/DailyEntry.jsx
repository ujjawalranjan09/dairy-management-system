import { useState, useEffect } from 'react'
import { customerAPI, productAPI, purchaseAPI } from '../services/api'
import { 
  Plus, 
  Minus,
  Calendar as CalendarIcon,
  Save,
  PlusCircle
} from 'lucide-react'
import SearchableCustomerSelect from '../components/SearchableCustomerSelect'

// ─── Unit helpers ────────────────────────────────────────────────────────────

// Returns allowed units for a product based on its base unit
function getUnitOptions(baseUnit) {
  const base = (baseUnit || '').toLowerCase()
  if (base === 'kg' || base === 'g') {
    return [
      { label: 'kg', value: 'kg' },
      { label: 'g',  value: 'g'  },
    ]
  }
  if (base === 'l' || base === 'ml' || base === 'liter' || base === 'litre') {
    return [
      { label: 'L',  value: 'L'  },
      { label: 'ml', value: 'ml' },
    ]
  }
  // fallback – just show the base unit
  return [{ label: baseUnit || 'unit', value: baseUnit || 'unit' }]
}

// Default selected unit when a product is chosen
function defaultUnit(baseUnit) {
  const base = (baseUnit || '').toLowerCase()
  if (base === 'kg' || base === 'g')             return 'kg'
  if (base === 'l' || base === 'ml' || base === 'liter' || base === 'litre') return 'L'
  return baseUnit || 'unit'
}

// Convert entered (qty, enteredUnit) → quantity in product's base unit
function toBaseQty(qty, enteredUnit, baseUnit) {
  const num = parseFloat(qty) || 0
  const eu  = (enteredUnit || '').toLowerCase()
  const bu  = (baseUnit    || '').toLowerCase()

  // weight
  if (bu === 'kg') {
    if (eu === 'g')  return num / 1000
    return num // kg → kg
  }
  if (bu === 'g') {
    if (eu === 'kg') return num * 1000
    return num // g → g
  }
  // volume
  if (bu === 'l' || bu === 'liter' || bu === 'litre') {
    if (eu === 'ml') return num / 1000
    return num // L → L
  }
  if (bu === 'ml') {
    if (eu === 'l' || eu === 'liter' || eu === 'litre') return num * 1000
    return num
  }
  return num // unknown – no conversion
}

// Price for one row = pricePerBaseUnit × quantityInBaseUnit
function rowPrice(price, qty, enteredUnit, baseUnit) {
  const baseQty = toBaseQty(qty, enteredUnit, baseUnit)
  return price * baseQty
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DailyEntry({ user }) {
  const canCreate = user?.role === 'ADMIN' || user?.role === 'EMPLOYEE'
  const [customers, setCustomers] = useState([])
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedDate,     setSelectedDate]     = useState(new Date().toISOString().split('T')[0])
  const [purchases, setPurchases] = useState([{
    productId: '',
    quantity:  1,
    unit:      'kg',   // selected unit (may differ from base unit)
  }])

  useEffect(() => { fetchInitialData() }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [cr, pr] = await Promise.all([customerAPI.getAll(), productAPI.getAll()])
      setCustomers(cr.data.customers)
      setProducts(pr.data.products)
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getProduct      = (id) => products.find(p => p.id === parseInt(id))
  const getProductPrice = (id) => getProduct(id)?.price ?? 0
  const getProductUnit  = (id) => getProduct(id)?.unit  ?? ''

  const addPurchase = () =>
    setPurchases([...purchases, { productId: '', quantity: 1, unit: 'kg' }])

  const removePurchase = (index) => {
    if (purchases.length > 1) setPurchases(purchases.filter((_, i) => i !== index))
  }

  const updatePurchase = (index, field, value) => {
    const next = [...purchases]
    next[index] = { ...next[index], [field]: value }

    // When the product changes, reset unit to the product's default
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
    if (validPurchases.length === 0) {
      setError('Please add at least one product with quantity > 0')
      return
    }

    try {
      setLoading(true)
      const purchasePromises = validPurchases.map(p =>
        purchaseAPI.create({
          customerId: parseInt(selectedCustomer),
          productId:  parseInt(p.productId),
          // store quantity in product's BASE unit
          quantity:   toBaseQty(p.quantity, p.unit, getProductUnit(p.productId)),
          date:       selectedDate,
        })
      )
      await Promise.all(purchasePromises)

      // If hand-to-hand payment option is clicked, record a PAID CASH payment immediately
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
          // If payment object is initialized or returned, immediately mark as PAID
          if (payRes.data?.payment?.id) {
            await paymentAPI.markAsPaid(payRes.data.payment.id)
          }
        } catch (paymentErr) {
          console.error('Hand-to-hand payment recording failed, but purchases were saved:', paymentErr)
        }
      }

      setSuccess(payHandToHand ? 'Purchases and cash payment saved successfully!' : 'Purchases saved successfully!')
      setPurchases([{ productId: '', quantity: 1, unit: 'kg' }])
      setSelectedCustomer('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save purchases')
    } finally {
      setLoading(false)
    }
  }

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Daily Purchase Entry</h1>
        <p className="text-gray-600">Record daily purchases for your customers</p>
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

      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6">

          {/* Customer + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
              <SearchableCustomerSelect
                customers={customers}
                value={selectedCustomer}
                onChange={(customerId) => {
                  setSelectedCustomer(customerId)
                  if (customerId) {
                    const cust = customers.find(c => c.id === parseInt(customerId))
                    if (cust && cust.defaultProduct) {
                      setPurchases([{
                        productId: String(cust.defaultProduct.id),
                        quantity: cust.defaultQuantity || 1,
                        unit: cust.defaultUnit || defaultUnit(cust.defaultProduct.unit)
                      }])
                    }
                  }
                }}
                placeholder="Select a customer..."
                required={true}
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Products</label>
            <div className="space-y-4">
              {purchases.map((purchase, index) => {
                const prod      = getProduct(purchase.productId)
                const baseUnit  = prod?.unit ?? ''
                const unitOpts  = prod ? getUnitOptions(baseUnit) : [{ label: 'kg', value: 'kg' }, { label: 'g', value: 'g' }, { label: 'L', value: 'L' }, { label: 'ml', value: 'ml' }]
                const price     = getProductPrice(purchase.productId)
                const lineTotal = rowPrice(price, purchase.quantity, purchase.unit, baseUnit)

                return (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg">

                    {/* Product select */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Product</label>
                      <select
                        value={purchase.productId}
                        onChange={(e) => updatePurchase(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.productName} - ₹{product.price}/{product.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity + Unit */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        Quantity
                        {prod && (
                          <span className="ml-1 text-indigo-500 font-medium">
                            (rate: ₹{price}/{prod.unit})
                          </span>
                        )}
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        {/* decrement */}
                        <button
                          type="button"
                          onClick={() => updatePurchase(index, 'quantity', Math.max(0.001, parseFloat(purchase.quantity) - 1))}
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        {/* number */}
                        <input
                          type="number"
                          value={purchase.quantity}
                          onChange={(e) => updatePurchase(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-2 border-0 focus:outline-none text-center"
                          min="0"
                          step="0.001"
                        />

                        {/* increment */}
                        <button
                          type="button"
                          onClick={() => updatePurchase(index, 'quantity', parseFloat(purchase.quantity) + 1)}
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        {/* unit selector */}
                        <select
                          value={purchase.unit}
                          onChange={(e) => updatePurchase(index, 'unit', e.target.value)}
                          className="border-l border-gray-300 px-2 py-2 bg-indigo-50 text-indigo-700 font-semibold focus:outline-none text-sm"
                        >
                          {unitOpts.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Line price */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Price</label>
                      <div className="px-3 py-2 bg-gray-50 rounded-md font-semibold text-gray-800">
                        ₹{lineTotal.toFixed(2)}
                      </div>
                    </div>

                    {/* Remove */}
                    {purchases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePurchase(index)}
                        className="self-center p-2 text-red-600 hover:text-red-800"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={addPurchase}
              className="mt-4 flex items-center px-4 py-2 text-indigo-600 hover:text-indigo-800"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Another Product
            </button>
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-indigo-600">₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-2">💵</span>
              {loading ? 'Processing...' : 'Paid by Cash'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Saving...' : 'Save Purchases'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}