// Visa requirements for different countries
export interface CountryVisaStatus {
  country: string;
  countryCode: string;
  visaRequired: boolean;
  category: 'EU_EFTA' | 'VISA_EXEMPT' | 'VISA_REQUIRED';
  description: string;
}

export const visaRequirements: CountryVisaStatus[] = [
  // EU/EFTA Countries (no visa required)
  { country: 'Austria', countryCode: 'AT', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Belgium', countryCode: 'BE', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Bulgaria', countryCode: 'BG', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Croatia', countryCode: 'HR', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Cyprus', countryCode: 'CY', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Czech Republic', countryCode: 'CZ', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Denmark', countryCode: 'DK', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Estonia', countryCode: 'EE', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Finland', countryCode: 'FI', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'France', countryCode: 'FR', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Germany', countryCode: 'DE', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Greece', countryCode: 'GR', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Hungary', countryCode: 'HU', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Ireland', countryCode: 'IE', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Italy', countryCode: 'IT', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Latvia', countryCode: 'LV', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Lithuania', countryCode: 'LT', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Luxembourg', countryCode: 'LU', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Malta', countryCode: 'MT', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Netherlands', countryCode: 'NL', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Poland', countryCode: 'PL', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Portugal', countryCode: 'PT', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Romania', countryCode: 'RO', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Slovakia', countryCode: 'SK', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Slovenia', countryCode: 'SI', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Spain', countryCode: 'ES', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Sweden', countryCode: 'SE', visaRequired: false, category: 'EU_EFTA', description: 'EU/EFTA citizen' },
  { country: 'Iceland', countryCode: 'IS', visaRequired: false, category: 'EU_EFTA', description: 'EFTA citizen' },
  { country: 'Liechtenstein', countryCode: 'LI', visaRequired: false, category: 'EU_EFTA', description: 'EFTA citizen' },
  { country: 'Norway', countryCode: 'NO', visaRequired: false, category: 'EU_EFTA', description: 'EFTA citizen' },
  { country: 'Switzerland', countryCode: 'CH', visaRequired: false, category: 'EU_EFTA', description: 'Swiss citizen' },

  // Visa-exempt countries (90 days tourist, but need work permit)
  { country: 'United States', countryCode: 'US', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Canada', countryCode: 'CA', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'United Kingdom', countryCode: 'GB', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Australia', countryCode: 'AU', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'New Zealand', countryCode: 'NZ', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Japan', countryCode: 'JP', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'South Korea', countryCode: 'KR', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Singapore', countryCode: 'SG', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Malaysia', countryCode: 'MY', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Brazil', countryCode: 'BR', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Argentina', countryCode: 'AR', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Chile', countryCode: 'CL', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Uruguay', countryCode: 'UY', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Israel', countryCode: 'IL', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Hong Kong', countryCode: 'HK', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Taiwan', countryCode: 'TW', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Macau', countryCode: 'MO', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Brunei', countryCode: 'BN', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Andorra', countryCode: 'AD', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Monaco', countryCode: 'MC', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'San Marino', countryCode: 'SM', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Vatican City', countryCode: 'VA', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },

  // Visa-required countries (need visa before entry)
  { country: 'China', countryCode: 'CN', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'India', countryCode: 'IN', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Russia', countryCode: 'RU', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Turkey', countryCode: 'TR', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Thailand', countryCode: 'TH', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Philippines', countryCode: 'PH', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Indonesia', countryCode: 'ID', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Vietnam', countryCode: 'VN', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'South Africa', countryCode: 'ZA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Nigeria', countryCode: 'NG', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Egypt', countryCode: 'EG', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Morocco', countryCode: 'MA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Sri Lanka', countryCode: 'LK', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'sri-lanka', countryCode: 'LK', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Bangladesh', countryCode: 'BD', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Pakistan', countryCode: 'PK', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Afghanistan', countryCode: 'AF', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Iran', countryCode: 'IR', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Iraq', countryCode: 'IQ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Syria', countryCode: 'SY', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Lebanon', countryCode: 'LB', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Jordan', countryCode: 'JO', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Saudi Arabia', countryCode: 'SA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'United Arab Emirates', countryCode: 'AE', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Kuwait', countryCode: 'KW', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Qatar', countryCode: 'QA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Bahrain', countryCode: 'BH', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Oman', countryCode: 'OM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Yemen', countryCode: 'YE', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Ethiopia', countryCode: 'ET', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Kenya', countryCode: 'KE', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Ghana', countryCode: 'GH', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Tanzania', countryCode: 'TZ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Uganda', countryCode: 'UG', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Rwanda', countryCode: 'RW', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Senegal', countryCode: 'SN', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Ivory Coast', countryCode: 'CI', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Cameroon', countryCode: 'CM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Democratic Republic of Congo', countryCode: 'CD', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Algeria', countryCode: 'DZ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Tunisia', countryCode: 'TN', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Libya', countryCode: 'LY', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Sudan', countryCode: 'SD', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Somalia', countryCode: 'SO', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Eritrea', countryCode: 'ER', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Djibouti', countryCode: 'DJ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Mauritania', countryCode: 'MR', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Mali', countryCode: 'ML', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Burkina Faso', countryCode: 'BF', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Niger', countryCode: 'NE', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Chad', countryCode: 'TD', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Central African Republic', countryCode: 'CF', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Republic of Congo', countryCode: 'CG', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Gabon', countryCode: 'GA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Equatorial Guinea', countryCode: 'GQ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'São Tomé and Príncipe', countryCode: 'ST', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Angola', countryCode: 'AO', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Zambia', countryCode: 'ZM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Zimbabwe', countryCode: 'ZW', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Botswana', countryCode: 'BW', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Namibia', countryCode: 'NA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Lesotho', countryCode: 'LS', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Swaziland', countryCode: 'SZ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Malawi', countryCode: 'MW', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Mozambique', countryCode: 'MZ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Madagascar', countryCode: 'MG', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Mauritius', countryCode: 'MU', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Seychelles', countryCode: 'SC', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Comoros', countryCode: 'KM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Cape Verde', countryCode: 'CV', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Guinea-Bissau', countryCode: 'GW', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Guinea', countryCode: 'GN', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Sierra Leone', countryCode: 'SL', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Liberia', countryCode: 'LR', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Gambia', countryCode: 'GM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Benin', countryCode: 'BJ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Togo', countryCode: 'TG', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Nepal', countryCode: 'NP', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Bhutan', countryCode: 'BT', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Myanmar', countryCode: 'MM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Laos', countryCode: 'LA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Cambodia', countryCode: 'KH', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Mongolia', countryCode: 'MN', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'North Korea', countryCode: 'KP', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Kazakhstan', countryCode: 'KZ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Uzbekistan', countryCode: 'UZ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Turkmenistan', countryCode: 'TM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Tajikistan', countryCode: 'TJ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Kyrgyzstan', countryCode: 'KG', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Azerbaijan', countryCode: 'AZ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Armenia', countryCode: 'AM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Georgia', countryCode: 'GE', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Moldova', countryCode: 'MD', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Belarus', countryCode: 'BY', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Ukraine', countryCode: 'UA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Albania', countryCode: 'AL', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Bosnia and Herzegovina', countryCode: 'BA', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Serbia', countryCode: 'RS', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Montenegro', countryCode: 'ME', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'North Macedonia', countryCode: 'MK', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Kosovo', countryCode: 'XK', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Cuba', countryCode: 'CU', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Haiti', countryCode: 'HT', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Dominican Republic', countryCode: 'DO', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Jamaica', countryCode: 'JM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Trinidad and Tobago', countryCode: 'TT', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Barbados', countryCode: 'BB', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Guyana', countryCode: 'GY', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Suriname', countryCode: 'SR', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Belize', countryCode: 'BZ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Guatemala', countryCode: 'GT', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Honduras', countryCode: 'HN', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'El Salvador', countryCode: 'SV', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Nicaragua', countryCode: 'NI', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Costa Rica', countryCode: 'CR', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Panama', countryCode: 'PA', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Colombia', countryCode: 'CO', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Venezuela', countryCode: 'VE', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Ecuador', countryCode: 'EC', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Peru', countryCode: 'PE', visaRequired: false, category: 'VISA_EXEMPT', description: 'Visa-exempt for tourism' },
  { country: 'Bolivia', countryCode: 'BO', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Paraguay', countryCode: 'PY', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Fiji', countryCode: 'FJ', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Papua New Guinea', countryCode: 'PG', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Solomon Islands', countryCode: 'SB', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Vanuatu', countryCode: 'VU', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Samoa', countryCode: 'WS', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Tonga', countryCode: 'TO', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Kiribati', countryCode: 'KI', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Tuvalu', countryCode: 'TV', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Nauru', countryCode: 'NR', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Palau', countryCode: 'PW', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Marshall Islands', countryCode: 'MH', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
  { country: 'Micronesia', countryCode: 'FM', visaRequired: true, category: 'VISA_REQUIRED', description: 'Visa required' },
];

// Function to get visa status for a country
export function getVisaStatus(countryName: string): CountryVisaStatus | null {
  if (!countryName) return null;
  
  const normalizedCountry = countryName.toLowerCase().trim();
  
  // Try exact match first
  let match = visaRequirements.find(country => 
    country.country.toLowerCase() === normalizedCountry
  );
  
  // Try with common variations if no exact match
  if (!match) {
    // Handle common variations like "sri-lanka" vs "sri lanka"
    const variations = [
      normalizedCountry,
      normalizedCountry.replace('-', ' '),
      normalizedCountry.replace(' ', '-'),
      normalizedCountry.replace('_', ' '),
      normalizedCountry.replace('_', '-')
    ];
    
    for (const variation of variations) {
      match = visaRequirements.find(country => 
        country.country.toLowerCase() === variation
      );
      if (match) break;
    }
  }
  
  // Try partial match if still no match
  if (!match) {
    match = visaRequirements.find(country => 
      country.country.toLowerCase().includes(normalizedCountry) ||
      normalizedCountry.includes(country.country.toLowerCase())
    );
  }
  
  return match || null;
}

// Function to get visa status by country code
export function getVisaStatusByCode(countryCode: string): CountryVisaStatus | null {
  return visaRequirements.find(country => 
    country.countryCode.toLowerCase() === countryCode.toLowerCase()
  ) || null;
}

// Function to determine user segment based on country
export function getUserSegment(countryName: string): 'eu_efta' | 'visa_exempt' | 'visa_required' | 'no_info' {
  if (!countryName) {
    console.log('getUserSegment: No country name provided');
    return 'no_info';
  }
  
  const visaStatus = getVisaStatus(countryName);
  console.log('getUserSegment: Country:', countryName, 'VisaStatus:', visaStatus);
  
  if (!visaStatus) {
    console.log('getUserSegment: No visa status found for country:', countryName);
    return 'no_info';
  }
  
  const segment = visaStatus.category.toLowerCase() as 'eu_efta' | 'visa_exempt' | 'visa_required' | 'no_info';
  console.log('getUserSegment: Final segment:', segment);
  return segment;
}