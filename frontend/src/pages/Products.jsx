import { useState, useEffect } from 'react'
import { productAPI } from '../services/api'
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'
import ProductModal from '../components/ProductModal'

export default function Products({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await productAPI.getAll()
      setProducts(response.data.products)
    } catch (err) {
      setError('Could not load products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try {
      await productAPI.delete(id)
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      setError('Could not delete product')
    }
  }

  const handleSave = (product) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === product.id ? product : p))
    } else {
      setProducts([product, ...products])
    }
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.unit.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">📦 Products</h1>
        <p className="page-subtitle">Manage your dairy products</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <div className="card p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 text-base min-h-[52px]"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary h-12 flex-shrink-0 active:scale-95">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-4xl animate-bounce">🥛</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-gray-500 font-medium text-sm">No products found</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-4 text-sm active:scale-95">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product, i) => (
            <div key={product.id} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center text-lg flex-shrink-0">
                  🥛
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-base">{product.productName}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">per {product.unit}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-lg font-extrabold text-gray-900">₹{product.price}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingProduct(product); setIsModalOpen(true) }}
                      className="p-2 text-brand-600 active:bg-brand-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-rose-500 active:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProduct(null) }}
        product={editingProduct}
        onSave={handleSave}
      />
    </div>
  )
}
