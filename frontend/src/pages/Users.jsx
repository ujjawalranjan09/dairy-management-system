import { useState, useEffect } from 'react'
import { authAPI, customerAPI } from '../services/api'
import { Plus, Users as UsersIcon, Shield, UserCheck, Eye, Edit, Trash2, X } from 'lucide-react'
import SearchableCustomerSelect from '../components/SearchableCustomerSelect'

const ROLES = { ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE', CUSTOMER: 'CUSTOMER' }

export default function Users({ user }) {
  const [users, setUsers] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', role: ROLES.EMPLOYEE, customerId: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, custRes] = await Promise.all([authAPI.getUsers(), customerAPI.getAll()])
      setUsers(usersRes.data.users || [])
      setCustomers(custRes.data.customers || [])
    } catch (err) {
      setError('Could not load users')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (u) => {
    setEditingUser(u)
    setFormData({ name: u.name, phone: u.phone, password: '', role: u.role, customerId: u.customerId ? u.customerId.toString() : '' })
    setShowForm(true)
  }

  const handleFormToggle = () => {
    if (showForm) { setShowForm(false); setEditingUser(null); setFormData({ name: '', phone: '', password: '', role: ROLES.EMPLOYEE, customerId: '' }) }
    else setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      const payload = { ...formData }
      if (payload.role !== ROLES.CUSTOMER) payload.customerId = null
      else if (payload.customerId) payload.customerId = parseInt(payload.customerId)
      else payload.customerId = null

      if (editingUser) {
        if (!payload.password) delete payload.password
        await authAPI.updateUser(editingUser.id, payload)
        setSuccess('✅ User updated!')
      } else {
        await authAPI.createUser(payload)
        setSuccess(`✅ ${formData.role === 'EMPLOYEE' ? 'Staff' : 'Customer'} account created!`)
      }
      setShowForm(false)
      setEditingUser(null)
      setFormData({ name: '', phone: '', password: '', role: ROLES.EMPLOYEE, customerId: '' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || `Could not ${editingUser ? 'update' : 'create'} user`)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (id, name) => {
    if (id === user.id) { setError('You cannot delete your own account'); return }
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setError('')
    setSuccess('')
    try {
      setLoading(true)
      await authAPI.deleteUser(id)
      setSuccess('✅ User deleted')
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete user')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getRoleEmoji = (role) => {
    switch (role) {
      case 'ADMIN': return '👑'
      case 'EMPLOYEE': return '👤'
      case 'CUSTOMER': return '🧑'
      default: return '👤'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN': return 'Owner'
      case 'EMPLOYEE': return 'Staff'
      case 'CUSTOMER': return 'Customer'
      default: return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-4xl animate-bounce">🥛</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="page-title">👨‍👩‍👧 Team</h1>
          <p className="page-subtitle">Manage staff and customer accounts</p>
        </div>
        <button onClick={handleFormToggle} className="btn-primary h-12 flex-shrink-0 active:scale-95">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Person
        </button>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">⚠️ {error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-medium">{success}</div>}

      {/* Form */}
      {showForm && (
        <div className="card p-4 md:p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-base">{editingUser ? '✏️ Edit Person' : '➕ Add New Person'}</h3>
            <button onClick={handleFormToggle} className="p-2 text-gray-400 active:text-gray-600 active:bg-gray-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">👤 Full Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required className="input text-base min-h-[52px]" placeholder="Enter name" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">📱 Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="input text-base min-h-[52px]" placeholder="9876543210" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">🔒 {editingUser ? 'New Password' : 'Password'}</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editingUser} className="input text-base min-h-[52px]" placeholder={editingUser ? 'Keep current' : 'Set password'} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">🎭 Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="select text-base py-3 min-h-[52px]">
                  <option value={ROLES.EMPLOYEE}>👤 Staff</option>
                  <option value={ROLES.CUSTOMER}>🧑 Customer</option>
                </select>
              </div>
            </div>

            {formData.role === ROLES.CUSTOMER && (
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">🔗 Link to Customer</label>
                <SearchableCustomerSelect
                  customers={customers}
                  value={formData.customerId}
                  onChange={(val) => setFormData(prev => ({ ...prev, customerId: val }))}
                  placeholder="Search customer..."
                  required={true}
                />
                <p className="text-xs text-gray-400 mt-1">This lets the customer log in and see their own bills.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={creating} className="btn-primary flex-1 h-12 active:scale-95">
                {creating ? 'Saving...' : editingUser ? '✅ Update' : '✅ Create'}
              </button>
              <button type="button" onClick={handleFormToggle} className="btn-secondary flex-1 h-12 active:scale-95">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* User List */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-3">👨‍👩‍👧</div>
            <p className="text-gray-500 font-medium text-sm">No users yet</p>
          </div>
        ) : (
          users.map((u, i) => (
            <div key={u.id} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg ${
                  u.role === ROLES.ADMIN ? 'bg-purple-100' :
                  u.role === ROLES.EMPLOYEE ? 'bg-blue-100' :
                  'bg-emerald-100'
                }`}>
                  {getRoleEmoji(u.role)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-base truncate">{u.name}</p>
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                      u.role === ROLES.ADMIN ? 'bg-purple-50 text-purple-700' :
                      u.role === ROLES.EMPLOYEE ? 'bg-blue-50 text-blue-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 font-medium">📱 {u.phone || u.email || '—'}</span>
                    {u.linkedCustomer && (
                      <span className="text-xs text-gray-300 font-medium">• 🔗 {u.linkedCustomer.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleEditClick(u)} className="p-2 text-brand-600 active:bg-brand-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Edit className="w-4 h-4" />
                  </button>
                  {u.id !== user.id && (
                    <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-2 text-rose-500 active:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-2">
        Only the shop owner (Admin) can add staff and customer accounts.
      </p>
    </div>
  )
}
