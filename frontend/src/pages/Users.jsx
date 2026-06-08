import { useState, useEffect } from 'react'
import { authAPI, customerAPI } from '../services/api'
import { 
  Plus, 
  Users as UsersIcon, 
  Shield, 
  UserCheck,
  Eye
} from 'lucide-react'

const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER'
}

export default function Users({ user }) {
  const [users, setUsers] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.EMPLOYEE,
    customerId: ''
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, custRes] = await Promise.all([
        authAPI.getUsers(),
        customerAPI.getAll()
      ])
      setUsers(usersRes.data.users || [])
      setCustomers(custRes.data.customers || [])
    } catch (err) {
      setError('Failed to load users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const payload = { ...formData }
      if (payload.role !== ROLES.CUSTOMER) {
        delete payload.customerId
      } else if (payload.customerId) {
        payload.customerId = parseInt(payload.customerId)
      }

      await authAPI.createUser(payload)
      setSuccess(`${formData.role} user created successfully`)
      setShowForm(false)
      setFormData({ name: '', email: '', password: '', role: ROLES.EMPLOYEE, customerId: '' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users &amp; Portals</h1>
          <p className="text-gray-600">Manage employees and customer self-service portal accounts (Admin only)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border">
          <h3 className="font-semibold mb-4">Create New User</h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Temporary Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value={ROLES.EMPLOYEE}>EMPLOYEE (Staff)</option>
                <option value={ROLES.CUSTOMER}>CUSTOMER (Portal Login)</option>
              </select>
            </div>

            {formData.role === ROLES.CUSTOMER && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Link to Existing Customer</label>
                <select 
                  name="customerId" 
                  value={formData.customerId} 
                  onChange={handleChange} 
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phoneNumber}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">The customer will be able to log in and see only their own purchases, bills and payments.</p>
              </div>
            )}

            <div className="md:col-span-2 flex gap-3">
              <button 
                type="submit" 
                disabled={creating}
                className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.role === ROLES.ADMIN ? 'bg-purple-100 text-purple-800' :
                    u.role === ROLES.EMPLOYEE ? 'bg-blue-100 text-blue-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {u.role === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1" />}
                    {u.role === ROLES.EMPLOYEE && <UserCheck className="w-3 h-3 mr-1" />}
                    {u.role === ROLES.CUSTOMER && <Eye className="w-3 h-3 mr-1" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {u.linkedCustomer ? `${u.linkedCustomer.name} (${u.linkedCustomer.phoneNumber})` : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <strong>Note:</strong> Only ADMIN can create EMPLOYEE and CUSTOMER accounts. CUSTOMER accounts must be linked to an existing customer record.
      </div>
    </div>
  )
}
