'use client';

import { useState, useEffect, useRef } from 'react';
import { searchPostalCodes, PostalCodeData } from '@/data/swissPostalCodes';

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
  const [suggestions, setSuggestions] = useState<PostalCodeData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 1) {
      const results = searchPostalCodes(value);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
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

  const handleSuggestionClick = (suggestion: PostalCodeData) => {
    onChange(suggestion.postalCode);
    onCityChange?.(suggestion.city);
    onCantonChange?.(suggestion.canton, suggestion.cantonCode);
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
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${className}`}
        autoComplete="off"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.postalCode}-${suggestion.city}`}
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
                    {suggestion.city}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {suggestion.cantonCode}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
