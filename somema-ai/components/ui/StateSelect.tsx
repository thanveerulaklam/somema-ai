'use client'

import { useState, useRef, useEffect } from 'react'
import { getStatesByCountry, type State } from '../../lib/states'
import { ChevronDown, Search } from 'lucide-react'

interface StateSelectProps {
  value: string
  onChange: (value: string) => void
  countryCode: string
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export function StateSelect({ 
  value, 
  onChange, 
  countryCode,
  placeholder = "Select a state/province", 
  required = false,
  className = "",
  disabled = false
}: StateSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get states for the selected country
  const availableStates = getStatesByCountry(countryCode)
  
  // Filter states based on search term
  const filteredStates = availableStates.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get the selected state object
  const selectedState = availableStates.find(state => state.name === value)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset value when country changes
  useEffect(() => {
    if (value && !availableStates.find(state => state.name === value)) {
      onChange('')
    }
  }, [countryCode, value, onChange, availableStates])

  const handleSelect = (state: State) => {
    onChange(state.name)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleToggle = () => {
    if (!disabled && availableStates.length > 0) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchTerm('')
      }
    }
  }

  // If no states available for this country, show a message
  if (availableStates.length === 0) {
    return (
      <div className={`px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-gray-300 rounded-md ${className}`}>
        No states/provinces available for this country
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || availableStates.length === 0}
        className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled || availableStates.length === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-900 hover:border-gray-400 cursor-pointer'
        } ${
          required && !value ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {selectedState ? selectedState.name : placeholder}
          </span>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* States list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredStates.length > 0 ? (
              filteredStates.map((state) => (
                <button
                  key={state.code}
                  type="button"
                  onClick={() => handleSelect(state)}
                  className={`w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                    state.name === value ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                  }`}
                >
                  {state.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No states found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
