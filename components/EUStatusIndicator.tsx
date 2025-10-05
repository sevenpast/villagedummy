'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface EUStatusIndicatorProps {
  countryCode: string;
  className?: string;
}

interface CountryInfo {
  code: string;
  name: string;
  isEU: boolean;
  isEFTA: boolean;
  isEUOrEFTA: boolean;
}

export default function EUStatusIndicator({ countryCode, className = '' }: EUStatusIndicatorProps) {
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!countryCode) {
      setCountryInfo(null);
      return;
    }

    const fetchCountryInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/eu-countries?code=${countryCode}`);
        if (response.ok) {
          const data = await response.json();
          setCountryInfo(data);
        } else {
          setCountryInfo(null);
        }
      } catch (error) {
        console.error('Failed to fetch country info:', error);
        setCountryInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountryInfo();
  }, [countryCode]);

  if (!countryCode) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`flex items-center text-sm text-gray-500 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        Checking EU/EFTA status...
      </div>
    );
  }

  if (!countryInfo) {
    return (
      <div className={`flex items-center text-sm text-gray-500 ${className}`}>
        <Info className="w-4 h-4 mr-2" />
        Country information not available
      </div>
    );
  }

  if (countryInfo.isEUOrEFTA) {
    return (
      <div className={`flex items-center text-sm text-green-600 ${className}`}>
        <CheckCircle className="w-4 h-4 mr-2" />
        <span>
          {countryInfo.isEU ? 'EU Citizen' : 'EFTA Citizen'} - 
          Free movement rights in Switzerland
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center text-sm text-orange-600 ${className}`}>
      <XCircle className="w-4 h-4 mr-2" />
      <span>
        Non-EU/EFTA Citizen - Visa may be required
      </span>
    </div>
  );
}
