// Swiss postal codes with major cities and cantons
export interface PostalCodeData {
  postalCode: string;
  city: string;
  canton: string;
  cantonCode: string;
}

export const swissPostalCodes: PostalCodeData[] = [
  // Zurich (ZH)
  { postalCode: '8001', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8002', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8003', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8004', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8005', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8006', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8008', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8032', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8050', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8052', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8057', city: 'Zürich', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8302', city: 'Kloten', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8400', city: 'Winterthur', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8404', city: 'Winterthur', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8810', city: 'Horgen', canton: 'Zurich', cantonCode: 'ZH' },
  { postalCode: '8820', city: 'Wädenswil', canton: 'Zurich', cantonCode: 'ZH' },
  
  // Bern (BE)
  { postalCode: '3000', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3001', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3003', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3005', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3006', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3007', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3008', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3010', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3011', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3012', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3013', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3014', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3015', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3018', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3019', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3020', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3027', city: 'Bern', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3600', city: 'Thun', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '3800', city: 'Interlaken', canton: 'Bern', cantonCode: 'BE' },
  { postalCode: '2500', city: 'Biel/Bienne', canton: 'Bern', cantonCode: 'BE' },
  
  // Geneva (GE)
  { postalCode: '1200', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1201', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1202', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1203', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1204', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1205', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1206', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1207', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1208', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1209', city: 'Geneva', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1213', city: 'Petit-Lancy', canton: 'Geneva', cantonCode: 'GE' },
  { postalCode: '1220', city: 'Les Avanchets', canton: 'Geneva', cantonCode: 'GE' },
  
  // Basel (BS)
  { postalCode: '4001', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4002', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4003', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4051', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4052', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4053', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4054', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4055', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4056', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4057', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4058', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  { postalCode: '4059', city: 'Basel', canton: 'Basel-Stadt', cantonCode: 'BS' },
  
  // Lausanne (VD)
  { postalCode: '1000', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1001', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1002', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1003', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1004', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1005', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1006', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1007', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1008', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1010', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1011', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1012', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1018', city: 'Lausanne', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1800', city: 'Vevey', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '1820', city: 'Montreux', canton: 'Vaud', cantonCode: 'VD' },
  
  // Lucerne (LU)
  { postalCode: '6000', city: 'Luzern', canton: 'Lucerne', cantonCode: 'LU' },
  { postalCode: '6003', city: 'Luzern', canton: 'Lucerne', cantonCode: 'LU' },
  { postalCode: '6004', city: 'Luzern', canton: 'Lucerne', cantonCode: 'LU' },
  { postalCode: '6005', city: 'Luzern', canton: 'Lucerne', cantonCode: 'LU' },
  { postalCode: '6006', city: 'Luzern', canton: 'Lucerne', cantonCode: 'LU' },
  { postalCode: '6010', city: 'Kriens', canton: 'Lucerne', cantonCode: 'LU' },
  
  // St. Gallen (SG)
  { postalCode: '9000', city: 'St. Gallen', canton: 'St. Gallen', cantonCode: 'SG' },
  { postalCode: '9001', city: 'St. Gallen', canton: 'St. Gallen', cantonCode: 'SG' },
  { postalCode: '9004', city: 'St. Gallen', canton: 'St. Gallen', cantonCode: 'SG' },
  { postalCode: '9006', city: 'St. Gallen', canton: 'St. Gallen', cantonCode: 'SG' },
  { postalCode: '9008', city: 'St. Gallen', canton: 'St. Gallen', cantonCode: 'SG' },
  { postalCode: '9010', city: 'St. Gallen', canton: 'St. Gallen', cantonCode: 'SG' },
  
  // Aargau (AG)
  { postalCode: '5000', city: 'Aarau', canton: 'Aargau', cantonCode: 'AG' },
  { postalCode: '5001', city: 'Aarau', canton: 'Aargau', cantonCode: 'AG' },
  { postalCode: '5400', city: 'Baden', canton: 'Aargau', cantonCode: 'AG' },
  { postalCode: '5401', city: 'Baden', canton: 'Aargau', cantonCode: 'AG' },
  { postalCode: '8953', city: 'Dietikon', canton: 'Aargau', cantonCode: 'AG' },
  
  // Other major cities
  { postalCode: '7000', city: 'Chur', canton: 'Graubünden', cantonCode: 'GR' },
  { postalCode: '6900', city: 'Lugano', canton: 'Ticino', cantonCode: 'TI' },
  { postalCode: '2000', city: 'Neuchâtel', canton: 'Neuchâtel', cantonCode: 'NE' },
  { postalCode: '1950', city: 'Sion', canton: 'Valais', cantonCode: 'VS' },
  { postalCode: '6300', city: 'Zug', canton: 'Zug', cantonCode: 'ZG' },
  { postalCode: '8200', city: 'Schaffhausen', canton: 'Schaffhausen', cantonCode: 'SH' },
  { postalCode: '4500', city: 'Solothurn', canton: 'Solothurn', cantonCode: 'SO' },
  { postalCode: '1700', city: 'Fribourg', canton: 'Fribourg', cantonCode: 'FR' },
  { postalCode: '1400', city: 'Yverdon-les-Bains', canton: 'Vaud', cantonCode: 'VD' },
  { postalCode: '2800', city: 'Delémont', canton: 'Jura', cantonCode: 'JU' },
  { postalCode: '6460', city: 'Altdorf', canton: 'Uri', cantonCode: 'UR' },
  { postalCode: '6430', city: 'Schwyz', canton: 'Schwyz', cantonCode: 'SZ' },
  { postalCode: '6390', city: 'Engelberg', canton: 'Obwalden', cantonCode: 'OW' },
  { postalCode: '6370', city: 'Stans', canton: 'Nidwalden', cantonCode: 'NW' },
  { postalCode: '9490', city: 'Vaduz', canton: 'Liechtenstein', cantonCode: 'FL' },
  { postalCode: '4410', city: 'Liestal', canton: 'Basel-Landschaft', cantonCode: 'BL' },
  { postalCode: '9100', city: 'Herisau', canton: 'Appenzell Ausserrhoden', cantonCode: 'AR' },
  { postalCode: '9050', city: 'Appenzell', canton: 'Appenzell Innerrhoden', cantonCode: 'AI' }
];

// Function to search postal codes
export const searchPostalCodes = (query: string): PostalCodeData[] => {
  if (!query || query.length < 1) return [];
  
  const lowercaseQuery = query.toLowerCase();
  
  return swissPostalCodes.filter(item => 
    item.postalCode.startsWith(query) ||
    item.city.toLowerCase().includes(lowercaseQuery) ||
    item.canton.toLowerCase().includes(lowercaseQuery)
  ).slice(0, 10); // Limit to 10 results
};
