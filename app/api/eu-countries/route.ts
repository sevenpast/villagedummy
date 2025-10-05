import { NextResponse } from 'next/server';

// EU/EFTA countries database
const euEftaCountries = {
  // EU Countries
  'AT': { name: 'Austria', isEU: true, isEFTA: false },
  'BE': { name: 'Belgium', isEU: true, isEFTA: false },
  'BG': { name: 'Bulgaria', isEU: true, isEFTA: false },
  'HR': { name: 'Croatia', isEU: true, isEFTA: false },
  'CY': { name: 'Cyprus', isEU: true, isEFTA: false },
  'CZ': { name: 'Czech Republic', isEU: true, isEFTA: false },
  'DK': { name: 'Denmark', isEU: true, isEFTA: false },
  'EE': { name: 'Estonia', isEU: true, isEFTA: false },
  'FI': { name: 'Finland', isEU: true, isEFTA: false },
  'FR': { name: 'France', isEU: true, isEFTA: false },
  'DE': { name: 'Germany', isEU: true, isEFTA: false },
  'GR': { name: 'Greece', isEU: true, isEFTA: false },
  'HU': { name: 'Hungary', isEU: true, isEFTA: false },
  'IE': { name: 'Ireland', isEU: true, isEFTA: false },
  'IT': { name: 'Italy', isEU: true, isEFTA: false },
  'LV': { name: 'Latvia', isEU: true, isEFTA: false },
  'LT': { name: 'Lithuania', isEU: true, isEFTA: false },
  'LU': { name: 'Luxembourg', isEU: true, isEFTA: false },
  'MT': { name: 'Malta', isEU: true, isEFTA: false },
  'NL': { name: 'Netherlands', isEU: true, isEFTA: false },
  'PL': { name: 'Poland', isEU: true, isEFTA: false },
  'PT': { name: 'Portugal', isEU: true, isEFTA: false },
  'RO': { name: 'Romania', isEU: true, isEFTA: false },
  'SK': { name: 'Slovakia', isEU: true, isEFTA: false },
  'SI': { name: 'Slovenia', isEU: true, isEFTA: false },
  'ES': { name: 'Spain', isEU: true, isEFTA: false },
  'SE': { name: 'Sweden', isEU: true, isEFTA: false },
  
  // EFTA Countries (not EU)
  'IS': { name: 'Iceland', isEU: false, isEFTA: true },
  'LI': { name: 'Liechtenstein', isEU: false, isEFTA: true },
  'NO': { name: 'Norway', isEU: false, isEFTA: true },
  'CH': { name: 'Switzerland', isEU: false, isEFTA: true },
  
  // Non-EU/EFTA Countries
  'US': { name: 'United States', isEU: false, isEFTA: false },
  'CA': { name: 'Canada', isEU: false, isEFTA: false },
  'GB': { name: 'United Kingdom', isEU: false, isEFTA: false },
  'AU': { name: 'Australia', isEU: false, isEFTA: false },
  'NZ': { name: 'New Zealand', isEU: false, isEFTA: false },
  'JP': { name: 'Japan', isEU: false, isEFTA: false },
  'KR': { name: 'South Korea', isEU: false, isEFTA: false },
  'IN': { name: 'India', isEU: false, isEFTA: false },
  'BR': { name: 'Brazil', isEU: false, isEFTA: false },
  'AR': { name: 'Argentina', isEU: false, isEFTA: false },
  'MX': { name: 'Mexico', isEU: false, isEFTA: false },
  'CN': { name: 'China', isEU: false, isEFTA: false },
  'TW': { name: 'Taiwan', isEU: false, isEFTA: false },
  'SG': { name: 'Singapore', isEU: false, isEFTA: false },
  'HK': { name: 'Hong Kong', isEU: false, isEFTA: false },
  'MY': { name: 'Malaysia', isEU: false, isEFTA: false },
  'TH': { name: 'Thailand', isEU: false, isEFTA: false },
  'PH': { name: 'Philippines', isEU: false, isEFTA: false },
  'ID': { name: 'Indonesia', isEU: false, isEFTA: false },
  'VN': { name: 'Vietnam', isEU: false, isEFTA: false },
  'RU': { name: 'Russia', isEU: false, isEFTA: false },
  'UA': { name: 'Ukraine', isEU: false, isEFTA: false },
  'ZA': { name: 'South Africa', isEU: false, isEFTA: false },
  'EG': { name: 'Egypt', isEU: false, isEFTA: false },
  'NG': { name: 'Nigeria', isEU: false, isEFTA: false },
  'KE': { name: 'Kenya', isEU: false, isEFTA: false },
  'MA': { name: 'Morocco', isEU: false, isEFTA: false },
  'TN': { name: 'Tunisia', isEU: false, isEFTA: false },
  'IL': { name: 'Israel', isEU: false, isEFTA: false },
  'TR': { name: 'Turkey', isEU: false, isEFTA: false },
  'SA': { name: 'Saudi Arabia', isEU: false, isEFTA: false },
  'AE': { name: 'United Arab Emirates', isEU: false, isEFTA: false },
  'QA': { name: 'Qatar', isEU: false, isEFTA: false },
  'KW': { name: 'Kuwait', isEU: false, isEFTA: false },
  'BH': { name: 'Bahrain', isEU: false, isEFTA: false },
  'OM': { name: 'Oman', isEU: false, isEFTA: false },
  'JO': { name: 'Jordan', isEU: false, isEFTA: false },
  'LB': { name: 'Lebanon', isEU: false, isEFTA: false },
  'PK': { name: 'Pakistan', isEU: false, isEFTA: false },
  'BD': { name: 'Bangladesh', isEU: false, isEFTA: false },
  'LK': { name: 'Sri Lanka', isEU: false, isEFTA: false },
  'NP': { name: 'Nepal', isEU: false, isEFTA: false },
  'MM': { name: 'Myanmar', isEU: false, isEFTA: false },
  'KH': { name: 'Cambodia', isEU: false, isEFTA: false },
  'LA': { name: 'Laos', isEU: false, isEFTA: false },
  'MN': { name: 'Mongolia', isEU: false, isEFTA: false },
  'KZ': { name: 'Kazakhstan', isEU: false, isEFTA: false },
  'UZ': { name: 'Uzbekistan', isEU: false, isEFTA: false },
  'KG': { name: 'Kyrgyzstan', isEU: false, isEFTA: false },
  'TJ': { name: 'Tajikistan', isEU: false, isEFTA: false },
  'TM': { name: 'Turkmenistan', isEU: false, isEFTA: false },
  'AF': { name: 'Afghanistan', isEU: false, isEFTA: false },
  'IR': { name: 'Iran', isEU: false, isEFTA: false },
  'IQ': { name: 'Iraq', isEU: false, isEFTA: false },
  'SY': { name: 'Syria', isEU: false, isEFTA: false },
  'YE': { name: 'Yemen', isEU: false, isEFTA: false },
  'LY': { name: 'Libya', isEU: false, isEFTA: false },
  'SD': { name: 'Sudan', isEU: false, isEFTA: false },
  'ET': { name: 'Ethiopia', isEU: false, isEFTA: false },
  'GH': { name: 'Ghana', isEU: false, isEFTA: false },
  'CI': { name: 'Ivory Coast', isEU: false, isEFTA: false },
  'SN': { name: 'Senegal', isEU: false, isEFTA: false },
  'ML': { name: 'Mali', isEU: false, isEFTA: false },
  'BF': { name: 'Burkina Faso', isEU: false, isEFTA: false },
  'NE': { name: 'Niger', isEU: false, isEFTA: false },
  'TD': { name: 'Chad', isEU: false, isEFTA: false },
  'CM': { name: 'Cameroon', isEU: false, isEFTA: false },
  'CF': { name: 'Central African Republic', isEU: false, isEFTA: false },
  'CD': { name: 'Democratic Republic of Congo', isEU: false, isEFTA: false },
  'CG': { name: 'Republic of Congo', isEU: false, isEFTA: false },
  'GA': { name: 'Gabon', isEU: false, isEFTA: false },
  'GQ': { name: 'Equatorial Guinea', isEU: false, isEFTA: false },
  'ST': { name: 'São Tomé and Príncipe', isEU: false, isEFTA: false },
  'AO': { name: 'Angola', isEU: false, isEFTA: false },
  'ZM': { name: 'Zambia', isEU: false, isEFTA: false },
  'ZW': { name: 'Zimbabwe', isEU: false, isEFTA: false },
  'BW': { name: 'Botswana', isEU: false, isEFTA: false },
  'NA': { name: 'Namibia', isEU: false, isEFTA: false },
  'SZ': { name: 'Eswatini', isEU: false, isEFTA: false },
  'LS': { name: 'Lesotho', isEU: false, isEFTA: false },
  'MG': { name: 'Madagascar', isEU: false, isEFTA: false },
  'MU': { name: 'Mauritius', isEU: false, isEFTA: false },
  'SC': { name: 'Seychelles', isEU: false, isEFTA: false },
  'KM': { name: 'Comoros', isEU: false, isEFTA: false },
  'DJ': { name: 'Djibouti', isEU: false, isEFTA: false },
  'SO': { name: 'Somalia', isEU: false, isEFTA: false },
  'ER': { name: 'Eritrea', isEU: false, isEFTA: false },
  'UG': { name: 'Uganda', isEU: false, isEFTA: false },
  'TZ': { name: 'Tanzania', isEU: false, isEFTA: false },
  'RW': { name: 'Rwanda', isEU: false, isEFTA: false },
  'BI': { name: 'Burundi', isEU: false, isEFTA: false },
  'MW': { name: 'Malawi', isEU: false, isEFTA: false },
  'MZ': { name: 'Mozambique', isEU: false, isEFTA: false },
  'CV': { name: 'Cape Verde', isEU: false, isEFTA: false },
  'GW': { name: 'Guinea-Bissau', isEU: false, isEFTA: false },
  'GN': { name: 'Guinea', isEU: false, isEFTA: false },
  'SL': { name: 'Sierra Leone', isEU: false, isEFTA: false },
  'LR': { name: 'Liberia', isEU: false, isEFTA: false },
  'TG': { name: 'Togo', isEU: false, isEFTA: false },
  'BJ': { name: 'Benin', isEU: false, isEFTA: false },
  'DZ': { name: 'Algeria', isEU: false, isEFTA: false },
  'MR': { name: 'Mauritania', isEU: false, isEFTA: false },
  'GM': { name: 'Gambia', isEU: false, isEFTA: false }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('code');

  if (countryCode) {
    // Check specific country
    const country = euEftaCountries[countryCode as keyof typeof euEftaCountries];
    if (country) {
      return NextResponse.json({
        code: countryCode,
        name: country.name,
        isEU: country.isEU,
        isEFTA: country.isEFTA,
        isEUOrEFTA: country.isEU || country.isEFTA
      });
    } else {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }
  }

  // Return all countries
  const allCountries = Object.entries(euEftaCountries).map(([code, data]) => ({
    code,
    name: data.name,
    isEU: data.isEU,
    isEFTA: data.isEFTA,
    isEUOrEFTA: data.isEU || data.isEFTA
  }));

  return NextResponse.json(allCountries);
}
