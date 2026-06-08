import { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

export default function SearchableCustomerSelect({
  customers = [],
  value = '',
  onChange,
  placeholder = 'Select customer...',
  required = false,
  showAllOption = false,
  allOptionLabel = 'All Customers',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // Find currently selected customer
  const selectedCustomer = customers.find(c => c.id.toString() === value?.toString())

  // Sync search input display with selected customer or clear
  useEffect(() => {
    if (selectedCustomer) {
      setSearchTerm(selectedCustomer.name)
    } else if (value === '') {
      setSearchTerm(showAllOption ? allOptionLabel : '')
    }
  }, [value, selectedCustomer, showAllOption, allOptionLabel])

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        // Reset search term to current selection
        if (selectedCustomer) {
          setSearchTerm(selectedCustomer.name)
        } else if (value === '') {
          setSearchTerm(showAllOption ? allOptionLabel : '')
        } else {
          setSearchTerm('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedCustomer, value, showAllOption, allOptionLabel])

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const term = searchTerm.toLowerCase()
    // If search term matches the current selection, don't filter out other customers
    if (selectedCustomer && selectedCustomer.name === searchTerm) {
      return true
    }
    if (showAllOption && searchTerm === allOptionLabel) {
      return true
    }
    return (
      customer.name.toLowerCase().includes(term) ||
      (customer.phoneNumber && customer.phoneNumber.includes(term))
    )
  })

  const handleSelect = (customer) => {
    if (customer === null) {
      onChange('')
      setSearchTerm(showAllOption ? allOptionLabel : '')
    } else {
      onChange(customer.id.toString())
      setSearchTerm(customer.name)
    }
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
    setIsOpen(false)
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
            // If selecting, clear the text to make it easy to type a new search
            if (selectedCustomer || (showAllOption && searchTerm === allOptionLabel)) {
              setSearchTerm('')
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100 text-sm"
          required={required && !value}
        />
        
        {/* Suffix icons */}
        <div className="absolute right-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronsUpDown className="w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul>
            {showAllOption && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(null)
                }}
                className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 text-sm flex items-center justify-between ${
                  !value ? 'bg-indigo-50/50 font-medium text-indigo-700' : 'text-gray-700'
                }`}
              >
                <span>{allOptionLabel}</span>
                {!value && <Check className="w-4 h-4 text-indigo-600" />}
              </li>
            )}
            
            {filteredCustomers.map(customer => {
              const isSelected = value?.toString() === customer.id.toString()
              return (
                <li
                  key={customer.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(customer)
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 text-sm flex items-center justify-between ${
                    isSelected ? 'bg-indigo-50/70 font-medium text-indigo-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={isSelected ? 'text-indigo-950 font-semibold' : 'text-gray-900 font-medium'}>
                      {customer.name}
                    </span>
                    {customer.phoneNumber && (
                      <span className="text-xs text-gray-500">
                        {customer.phoneNumber}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                </li>
              )
            })}
            
            {filteredCustomers.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-gray-500 italic">
                No matching customers found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
