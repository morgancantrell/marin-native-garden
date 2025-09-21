"use client";
import { useEffect, useRef, useState } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter your Marin County address",
  className = "",
  id = "address"
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Marin County bounding box coordinates
  const marinCountyBounds = {
    north: 38.3,
    south: 37.8,
    east: -122.3,
    west: -123.0
  };

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&` +
        `country=US&` +
        `bbox=${marinCountyBounds.west},${marinCountyBounds.south},${marinCountyBounds.east},${marinCountyBounds.north}&` +
        `limit=5&` +
        `types=address,poi`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      
      // Filter results to ensure they're in Marin County
      const marinResults = data.features.filter((feature: any) => {
        const [lng, lat] = feature.center;
        return lat >= marinCountyBounds.south && 
               lat <= marinCountyBounds.north && 
               lng >= marinCountyBounds.west && 
               lng <= marinCountyBounds.east;
      });

      setSuggestions(marinResults);
      setShowSuggestions(marinResults.length > 0);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Only search if the change wasn't from browser autofill
    // Browser autofill typically happens very quickly, so we can detect it
    if (newValue.length >= 3) {
      // Small delay to avoid conflicts with browser autofill
      setTimeout(() => {
        searchAddresses(newValue);
      }, 100);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    onChange(suggestion.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        id={id}
        name="address"
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${className}`}
        autoComplete="street-address"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-500 rounded-md shadow-xl max-h-60 overflow-y-auto">
          <div className="px-3 py-1 text-xs text-blue-600 bg-blue-50 border-b">
            Found {suggestions.length} Marin County address{suggestions.length !== 1 ? 'es' : ''}
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-900 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium">{suggestion.place_name}</div>
              {suggestion.context && (
                <div className="text-xs text-gray-500 mt-1">
                  {suggestion.context.map((ctx: any) => ctx.text).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
