import { useState, useEffect } from 'react'
import { customerAPI, productAPI, authAPI } from '../services/api'
import { X, Plus, Trash2 } from 'lucide-react'

export default function CustomerModal({ isOpen, onClose, customer, onSave }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phoneNumber: customer?.phoneNumber || '',
    address: customer?.address || '',
    assignedEmployeeId: customer?.assignedEmployeeId || ''
  })
  const [defaultProducts, setDefaultProducts] = useState([])
  const [products, setProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setFormData({
      name: customer?.name || '',
      phoneNumber: customer?.phoneNumber || '',
      address: customer?.address || '',
      assignedEmployeeId: customer?.assignedEmployeeId || ''
    })
    if (customer?.defaultProducts) {
      setDefaultProducts(customer.defaultProducts.map(dp => ({
        productId: dp.productId.toString(), quantity: dp.quantity, unit: dp.unit
      })))
    } else {
      setDefaultProducts([])
    }
  }, [customer])

  useEffect(() => {
    if (!isOpen) return
    const fetchMeta = async () => {
      try {
        const [prodRes, usersRes] = await Promise.all([productAPI.getAll(), authAPI.getUsers()])
        setProducts(prodRes.data.products || [])
        setEmployees((usersRes.data.users || []).filter(u => u.role === 'EMPLOYEE' || u.role === 'ADMIN'))
      } catch (err) { console.error(err) }
    }
    fetchMeta()
  }, [isOpen])

  const handleAddDefaultProduct = () => setDefaultProducts(prev => [...prev, { productId: '', quantity: 1, unit: '' }])
  const handleRemoveDefaultProduct = (index) => setDefaultProducts(prev => prev.filter((_, i) => i !== index))

  const handleDefaultProductChange = (index, field, value) => {
    setDefaultProducts(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'productId') {
        const selected = products.find(p => p.id === parseInt(value))
        updated[index].unit = selected ? selected.unit : ''
      }
      return updated
    })
  }

  const getUnitOptions = (productId) => {
    const selectedProduct = products.find(p => p.id === parseInt(productId))
    if (!selectedProduct) return <option value="">Unit</option>
    const base = (selectedProduct.unit || '').toLowerCase()
    if (base === 'kg' || base === 'g') return <><option value="kg">kg</option><option value="g">g</option></>
    if (base === 'l' || base === 'ml' || base === 'liter' || base === 'litre') return <><option value="L">L</option><option value="ml">ml</option></>
    return <option value={selectedProduct.unit}>{selectedProduct.unit}</option>
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const filteredDefaults = defaultProducts.filter(dp => dp.productId).map(dp => ({
        productId: parseInt(dp.productId), quantity: parseFloat(dp.quantity) || 1, unit: dp.unit
      }))
      const payload = {
        name: formData.name, phoneNumber: formData.phoneNumber, address: formData.address,
        defaultProducts: filteredDefaults, assignedEmployeeId: formData.assignedEmployeeId || null
      }
      if (customer) {
        const response = await customerAPI.update(customer.id, payload)
        onSave(response.data.customer)
      } else {
        const response = await customerAPI.create(payload)
        onSave(response.data.customer)
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
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-5 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-900">{customer ? '✏️ Edit Customer' : '➕ Add Customer'}</h3>
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
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">👤 Customer Name *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input" placeholder="Enter customer name" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">📱 Phone Number *</label>
            <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} className="input" placeholder="Enter phone number" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">📍 Address</label>
            <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className="input resize-none" placeholder="Enter address (optional)"></textarea>
          </div>

          {/* Default Products */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700">🥛 Default Products</label>
              <button type="button" onClick={handleAddDefaultProduct} className="text-xs font-bold text-brand-600 active:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-xl">
                <Plus className="w-3 h-3 inline mr-0.5" />Add
              </button>
            </div>
            {defaultProducts.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400 font-medium">
                No default products. Click "+ Add" to set what this customer usually buys.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {defaultProducts.map((dp, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1 min-w-0">
                      <select value={dp.productId} onChange={(e) => handleDefaultProductChange(index, 'productId', e.target.value)} className="select text-xs py-2">
                        <option value="">Select product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.productName} (₹{p.price})</option>)}
                      </select>
                    </div>
                    <input type="number" min="0.001" step="0.001" placeholder="Qty" value={dp.quantity} onChange={(e) => handleDefaultProductChange(index, 'quantity', e.target.value)} className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                    <div className="w-16">
                      <select value={dp.unit} onChange={(e) => handleDefaultProductChange(index, 'unit', e.target.value)} className="select text-xs py-2">
                        {getUnitOptions(dp.productId)}
                      </select>
                    </div>
                    <button type="button" onClick={() => handleRemoveDefaultProduct(index)} className="p-2 text-rose-500 active:bg-rose-50 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Employee */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">👤 Assign to Staff</label>
            <select name="assignedEmployeeId" value={formData.assignedEmployeeId} onChange={handleChange} className="select text-sm">
              <option value="">No specific staff member</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role === 'ADMIN' ? 'Owner' : 'Staff'})</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 h-12">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1 h-12">
              {isLoading ? 'Saving...' : customer ? '✅ Update' : '✅ Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
