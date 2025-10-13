'use client';

import { useState, useEffect, useRef } from 'react';

interface MunicipalityData {
  postalCode: string;
  municipalityName: string;
  cantonCode: string;
  cantonName: string;
}

interface PostalCodeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCityChange?: (city: string) => void;
  onCantonChange?: (canton: string, cantonCode: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PostalCodeAutocomplete({
  value,
  onChange,
  onCityChange,
  onCantonChange,
  placeholder = "Enter postal code or city...",
  className = ""
}: PostalCodeAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MunicipalityData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchMunicipalities = async () => {
      if (value.length >= 1) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/municipalities/search?q=${encodeURIComponent(value)}&limit=20`);
          const data = await response.json();
          setSuggestions(data.municipalities || []);
          setIsOpen((data.municipalities || []).length > 0);
          setHighlightedIndex(-1);
        } catch (error) {
          console.error('Error searching municipalities:', error);
          setSuggestions([]);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    };

    const timeoutId = setTimeout(searchMunicipalities, 150); // Reduced debounce for faster response
    return () => clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: MunicipalityData) => {
    onChange(suggestion.postalCode);
    onCityChange?.(suggestion.municipalityName);
    onCantonChange?.(suggestion.cantonName, suggestion.cantonCode);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 1 && suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${className}`}
        autoComplete="off"
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.postalCode}-${suggestion.municipalityName}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                  index === highlightedIndex ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">
                      {suggestion.postalCode}
                    </span>
                    <span className="ml-2 text-gray-600">
                      {suggestion.municipalityName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {suggestion.cantonCode}
                  </span>
                </div>
              </div>
            ))
          ) : value.length >= 2 ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              No municipalities found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
