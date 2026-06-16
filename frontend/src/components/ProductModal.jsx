import { useState } from 'react'
import { productAPI } from '../services/api'
import { X } from 'lucide-react'

export default function ProductModal({ isOpen, onClose, product, onSave }) {
  const [formData, setFormData] = useState({
    productName: product?.productName || '',
    price: product?.price || '',
    unit: product?.unit || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      if (product) {
        const response = await productAPI.update(product.id, formData)
        onSave(response.data.product)
      } else {
        const response = await productAPI.create(formData)
        onSave(response.data.product)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl animate-slide-up">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥛</span>
            <h3 className="text-lg font-bold text-gray-900">{product ? 'Edit Product' : 'Add Product'}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">📦 Product Name *</label>
            <input type="text" name="productName" required value={formData.productName} onChange={handleChange} className="input" placeholder="e.g. Full Cream Milk" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">💰 Price (₹) *</label>
              <input type="number" name="price" step="0.01" min="0" required value={formData.price} onChange={handleChange} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">📏 Unit *</label>
              <input type="text" name="unit" required value={formData.unit} onChange={handleChange} className="input" placeholder="kg, L, etc." />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 h-12">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1 h-12">
              {isLoading ? 'Saving...' : product ? '✅ Update' : '✅ Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
