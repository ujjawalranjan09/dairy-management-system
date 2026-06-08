import { useState, useEffect } from 'react'
import { customerAPI, productAPI, purchaseAPI } from '../services/api'
import { 
  Plus, 
  Minus,
  Calendar as CalendarIcon,
  Save,
  PlusCircle
} from 'lucide-react'

export default function DailyEntry({ user }) {
  const canCreate = user?.role === 'ADMIN' || user?.role === 'EMPLOYEE'
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [purchases, setPurchases] = useState([{
    productId: '',
    quantity: 1
  }])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [customersResponse, productsResponse] = await Promise.all([
        customerAPI.getAll(),
        productAPI.getAll()
      ])
      setCustomers(customersResponse.data.customers)
      setProducts(productsResponse.data.products)
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addPurchase = () => {
    setPurchases([...purchases, { productId: '', quantity: 1 }])
  }

  const removePurchase = (index) => {
    if (purchases.length > 1) {
      setPurchases(purchases.filter((_, i) => i !== index))
    }
  }

  const updatePurchase = (index, field, value) => {
    const newPurchases = [...purchases]
    newPurchases[index][field] = value
    setPurchases(newPurchases)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedCustomer) {
      setError('Please select a customer')
      return
    }

    const validPurchases = purchases.filter(p => p.productId && p.quantity > 0)
    if (validPurchases.length === 0) {
      setError('Please add at least one product with quantity > 0')
      return
    }

    try {
      setLoading(true)
      
      // Create all purchases
      const purchasePromises = validPurchases.map(purchase => 
        purchaseAPI.create({
          customerId: parseInt(selectedCustomer),
          productId: parseInt(purchase.productId),
          quantity: parseInt(purchase.quantity),
          date: selectedDate
        })
      )

      await Promise.all(purchasePromises)
      
      setSuccess('Purchases saved successfully!')
      setPurchases([{ productId: '', quantity: 1 }])
      setSelectedCustomer('')
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save purchases')
    } finally {
      setLoading(false)
    }
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    return product ? product.productName : 'Unknown'
  }

  const getProductPrice = (productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    return product ? product.price : 0
  }

  const calculateTotal = () => {
    return purchases.reduce((total, purchase) => {
      if (purchase.productId && purchase.quantity > 0) {
        const price = getProductPrice(purchase.productId)
        return total + (price * purchase.quantity)
      }
      return total
    }, 0)
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
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                id="customer"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phoneNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
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

          {/* Purchases */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Products
            </label>
            <div className="space-y-4">
              {purchases.map((purchase, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg">
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
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updatePurchase(index, 'quantity', Math.max(1, purchase.quantity - 1))}
                        className="px-3 py-2 bg-gray-50 hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={purchase.quantity}
                        onChange={(e) => updatePurchase(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-3 py-2 border-0 focus:outline-none"
                        min="1"
                      />
                      <button
                        type="button"
                        onClick={() => updatePurchase(index, 'quantity', purchase.quantity + 1)}
                        className="px-3 py-2 bg-gray-50 hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Price</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                      ₹{getProductPrice(purchase.productId) * purchase.quantity}
                    </div>
                  </div>
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
              ))}
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

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-indigo-600">₹{calculateTotal()}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
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