import { useState, useEffect } from 'react'
import { customerAPI } from '../services/api'
import { Plus, Search, Edit, Trash2, Phone, MapPin, Users, UserCheck } from 'lucide-react'
import CustomerModal from '../components/CustomerModal'

export default function Customers({ user }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(user?.role === 'EMPLOYEE' ? 'assigned' : 'all')

  const canManage = user?.role === 'ADMIN' || user?.role === 'EMPLOYEE'
  const canDelete = user?.role === 'ADMIN'

  useEffect(() => { fetchCustomers() }, [])

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeout = setTimeout(() => handleSearch(), 500)
      return () => clearTimeout(timeout)
    } else if (searchQuery === '') {
      fetchCustomers()
    }
  }, [searchQuery])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerAPI.getAll()
      setCustomers(response.data.customers)
    } catch (err) {
      setError('Could not load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (searchQuery.length < 3) return
    try {
      const response = await customerAPI.search(searchQuery)
      setCustomers(response.data.customers)
    } catch (err) {
      setError('Search failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return
    try {
      await customerAPI.delete(id)
      setCustomers(customers.filter(c => c.id !== id))
    } catch (err) {
      setError('Could not delete customer')
    }
  }

  const handleSave = (customer) => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === customer.id ? customer : c))
    } else {
      setCustomers([customer, ...customers])
    }
    setIsModalOpen(false)
    setEditingCustomer(null)
  }

  const filteredCustomers = customers.filter(customer => {
    if (user?.role === 'EMPLOYEE' && activeTab === 'assigned') {
      if (customer.assignedEmployeeId !== user.id) return false
    }
    return (
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phoneNumber.includes(searchQuery)
    )
  })

  const assignedCount = customers.filter(c => c.assignedEmployeeId === user?.id).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="page-title">👥 Customers</h1>
          <p className="page-subtitle">Your dairy customers</p>
        </div>
        {user?.role === 'EMPLOYEE' && (
          <div className="flex bg-gray-100 p-1 rounded-2xl max-w-max">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all active:scale-95 min-h-[44px] ${
                activeTab === 'assigned' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Mine
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'assigned' ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-600'
              }`}>{assignedCount}</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all active:scale-95 min-h-[44px] ${
                activeTab === 'all' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              All
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'all' ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-600'
              }`}>{customers.length}</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Search + Add */}
      <div className="card p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="🔍 Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 text-base min-h-[52px]"
            />
          </div>
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary h-12 flex-shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-4xl animate-bounce">🥛</div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-gray-500 font-medium text-sm">No customers found</p>
          {canManage && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-4 text-sm active:scale-95">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Your First Customer
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer, i) => (
            <div key={customer.id} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-2xl flex items-center justify-center font-bold text-base flex-shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-base truncate">{customer.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                      <Phone className="w-3 h-3" />
                      {customer.phoneNumber}
                    </span>
                    {customer.address && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-medium truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canManage && (
                    <button
                      onClick={() => { setEditingCustomer(customer); setIsModalOpen(true) }}
                      className="p-2 text-brand-600 active:bg-brand-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-rose-500 active:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCustomer(null) }}
        customer={editingCustomer}
        onSave={handleSave}
      />
    </div>
  )
}
