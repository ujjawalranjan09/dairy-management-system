import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronsUpDown, X, Search, Package } from 'lucide-react'

function ProductListItem({ product, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors active:bg-gray-100 ${
        isSelected ? 'bg-brand-50' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg ${
        isSelected ? 'bg-brand-200 text-brand-700' : 'bg-brand-100 text-brand-600'
      }`}>
        🥛
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isSelected ? 'text-brand-900' : 'text-gray-900'}`}>
          {product.productName}
        </p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">
          ₹{product.price}/{product.unit}
        </p>
      </div>
      {isSelected && <Check className="w-5 h-5 text-brand-600 flex-shrink-0" />}
    </button>
  )
}

export default function SearchableProductSelect({
  products = [],
  value = '',
  onChange,
  placeholder = 'Search product...',
  required = false,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const selectedProduct = products.find(p => p.id.toString() === value?.toString())

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (selectedProduct) setSearchTerm(selectedProduct.productName)
    else setSearchTerm('')
  }, [value, selectedProduct])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        if (selectedProduct) setSearchTerm(selectedProduct.productName)
        else setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedProduct])

  useEffect(() => {
    if (isOpen && isMobile && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen, isMobile])

  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase()
    if (selectedProduct && selectedProduct.productName === searchTerm) return true
    return product.productName.toLowerCase().includes(term)
  })

  const handleSelect = (product) => {
    onChange(product.id.toString())
    setSearchTerm(product.productName)
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
    setIsOpen(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    if (selectedProduct) setSearchTerm(selectedProduct.productName)
    else setSearchTerm('')
  }

  const handleInputFocus = () => {
    if (isMobile) {
      setIsOpen(true)
      setSearchTerm('')
    }
  }

  const content = (
    <div className="py-1">
      {filteredProducts.map(product => {
        const isSelected = value?.toString() === product.id.toString()
        return (
          <ProductListItem
            key={product.id}
            product={product}
            isSelected={isSelected}
            onSelect={handleSelect}
          />
        )
      })}
      {filteredProducts.length === 0 && (
        <div className="px-4 py-8 text-center">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-sm text-gray-400 font-medium">No products found</p>
        </div>
      )}
    </div>
  )

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <>
        <div className="relative w-full" ref={dropdownRef}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true) }}
              onFocus={handleInputFocus}
              onClick={() => { setIsOpen(true); setSearchTerm('') }}
              placeholder={placeholder}
              disabled={disabled}
              className="input pr-10 text-base min-h-[52px]"
              required={required && !value}
              readOnly={false}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {value && !disabled && (
                <button type="button" onClick={handleClear} className="p-2 rounded-full text-gray-400 active:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              )}
              <ChevronsUpDown className="w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {isOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={handleClose}></div>
            <div className="relative bg-white w-full rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300"></div>
              </div>
              <div className="flex items-center gap-3 px-4 pb-3 border-b border-gray-100">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Search products..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-2xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[52px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 text-gray-400 active:bg-gray-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {content}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  // Desktop: dropdown
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true) }}
          onFocus={() => {
            setIsOpen(true)
            if (selectedProduct) setSearchTerm('')
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="input pr-10 text-sm"
          required={required && !value}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && !disabled && (
            <button type="button" onClick={handleClear} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronsUpDown className="w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
          <ul className="py-1">
            {filteredProducts.map(product => {
              const isSelected = value?.toString() === product.id.toString()
              return (
                <li
                  key={product.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(product) }}
                  className={`px-3 py-2.5 cursor-pointer hover:bg-brand-50 text-sm flex items-center justify-between mx-1 rounded-xl transition-colors ${
                    isSelected ? 'bg-brand-50/70 font-semibold text-brand-700' : 'text-gray-600'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={isSelected ? 'text-brand-900 font-semibold' : 'text-gray-900 font-medium'}>
                      {product.productName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      ₹{product.price}/{product.unit}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                </li>
              )
            })}
            {filteredProducts.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-gray-400 italic">No matching products</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
