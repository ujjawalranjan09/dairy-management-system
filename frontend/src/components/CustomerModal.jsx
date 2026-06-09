import { useState, useEffect } from 'react'
import { customerAPI, productAPI, authAPI } from '../services/api'
import { X } from 'lucide-react'

export default function CustomerModal({ isOpen, onClose, customer, onSave }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phoneNumber: customer?.phoneNumber || '',
    address: customer?.address || '',
    defaultProductId: customer?.defaultProductId || '',
    defaultQuantity: customer?.defaultQuantity || 1,
    defaultUnit: customer?.defaultUnit || '',
    assignedEmployeeId: customer?.assignedEmployeeId || ''
  })
  const [products, setProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Reload form data when customer prop changes
  useEffect(() => {
    setFormData({
      name: customer?.name || '',
      phoneNumber: customer?.phoneNumber || '',
      address: customer?.address || '',
      defaultProductId: customer?.defaultProductId || '',
      defaultQuantity: customer?.defaultQuantity || 1,
      defaultUnit: customer?.defaultUnit || '',
      assignedEmployeeId: customer?.assignedEmployeeId || ''
    })
  }, [customer])

  // Fetch products and employees
  useEffect(() => {
    if (!isOpen) return
    const fetchMeta = async () => {
      try {
        const [prodRes, usersRes] = await Promise.all([
          productAPI.getAll(),
          authAPI.getUsers()
        ])
        setProducts(prodRes.data.products || [])
        // Filter for EMPLOYEE and ADMIN users only
        const allUsers = usersRes.data.users || []
        setEmployees(allUsers.filter(u => u.role === 'EMPLOYEE' || u.role === 'ADMIN'))
      } catch (err) {
        console.error('Failed to load products/employees', err)
      }
    }
    fetchMeta()
  }, [isOpen])

  // When default product changes, auto-set the default unit
  const handleProductChange = (e) => {
    const productId = e.target.value
    const selected = products.find(p => p.id === parseInt(productId))
    setFormData(prev => ({
      ...prev,
      defaultProductId: productId,
      defaultUnit: selected ? selected.unit : ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Build payload - convert empty strings to null for optional fields
      const payload = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        defaultProductId: formData.defaultProductId || null,
        defaultQuantity: formData.defaultProductId ? parseFloat(formData.defaultQuantity) || 1 : null,
        defaultUnit: formData.defaultProductId ? formData.defaultUnit : null,
        assignedEmployeeId: formData.assignedEmployeeId || null
      }

      if (customer) {
        const response = await customerAPI.update(customer.id, payload)
        onSave(response.data.customer)
      } else {
        const response = await customerAPI.create(payload)
        onSave(response.data.customer)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  const selectedProduct = products.find(p => p.id === parseInt(formData.defaultProductId))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {customer ? 'Edit Customer' : 'Add Customer'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                {/* Basic Info */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>

                {/* Separator */}
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Default Purchase Settings</p>

                  {/* Default Product */}
                  <div className="mb-3">
                    <label htmlFor="defaultProductId" className="block text-sm font-medium text-gray-700">
                      Default Product
                    </label>
                    <select
                      id="defaultProductId"
                      name="defaultProductId"
                      value={formData.defaultProductId}
                      onChange={handleProductChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">— No default product —</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.productName} — ₹{p.price}/{p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Default Quantity and Unit — only show if a product is selected */}
                  {formData.defaultProductId && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="defaultQuantity" className="block text-sm font-medium text-gray-700">
                          Default Quantity
                        </label>
                        <input
                          type="number"
                          id="defaultQuantity"
                          name="defaultQuantity"
                          min="0.001"
                          step="0.001"
                          value={formData.defaultQuantity}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="defaultUnit" className="block text-sm font-medium text-gray-700">
                          Unit
                        </label>
                        <select
                          id="defaultUnit"
                          name="defaultUnit"
                          value={formData.defaultUnit}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {selectedProduct && (() => {
                            const base = (selectedProduct.unit || '').toLowerCase()
                            if (base === 'kg' || base === 'g') {
                              return (
                                <>
                                  <option value="kg">kg</option>
                                  <option value="g">g</option>
                                </>
                              )
                            }
                            if (base === 'l' || base === 'ml' || base === 'liter' || base === 'litre') {
                              return (
                                <>
                                  <option value="L">L</option>
                                  <option value="ml">ml</option>
                                </>
                              )
                            }
                            return <option value={selectedProduct.unit}>{selectedProduct.unit}</option>
                          })()}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assigned Employee */}
                <div>
                  <label htmlFor="assignedEmployeeId" className="block text-sm font-medium text-gray-700">
                    Assigned Employee
                    <span className="text-gray-400 font-normal text-xs ml-1">(others can still enter data)</span>
                  </label>
                  <select
                    id="assignedEmployeeId"
                    name="assignedEmployeeId"
                    value={formData.assignedEmployeeId}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">— No specific employee —</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role}) — {emp.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (customer ? 'Updating...' : 'Creating...') : (customer ? 'Update Customer' : 'Add Customer')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}