import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dairy-backend-q3x2.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  // ADMIN only - ERP user management (Employees + Customer portal accounts)
  getUsers: () => api.get('/auth/users'),
  createUser: (userData) => api.post('/auth/users', userData),
}

// Customer endpoints
export const customerAPI = {
  getAll: () => api.get('/customers'),
  search: (query) => api.get(`/customers/search?query=${query}`),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customerData) => api.post('/customers', customerData),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: (id) => api.delete(`/customers/${id}`),
}

// Product endpoints
export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
}

// Purchase endpoints
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getToday: () => api.get('/purchases/today'),
  getByCustomer: (customerId, params) => api.get(`/purchases/customer/${customerId}`, { params }),
  create: (purchaseData) => api.post('/purchases', purchaseData),
  delete: (id) => api.delete(`/purchases/${id}`),
}

// Billing endpoints
export const billingAPI = {
  getMonthly: (params) => api.get('/billing/monthly', { params }),
  getCustomer: (customerId, params) => api.get(`/billing/customer/${customerId}`, { params }),
}

// Payment endpoints
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getPending: () => api.get('/payments/pending'),
  create: (paymentData) => api.post('/payments', paymentData),
  markAsPaid: (id) => api.put(`/payments/${id}/mark-paid`),
  markAsFailed: (id) => api.put(`/payments/${id}/mark-failed`),
}

// Dashboard endpoints
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
}

export default api