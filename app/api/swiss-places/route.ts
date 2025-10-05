import { NextResponse } from 'next/server';

const swissPlaces = [
  { postalCode: '8001', name: 'Zürich', canton: 'ZH' }, { postalCode: '8002', name: 'Zürich', canton: 'ZH' },
  { postalCode: '8003', name: 'Zürich', canton: 'ZH' }, { postalCode: '8004', name: 'Zürich', canton: 'ZH' },
  { postalCode: '8005', name: 'Zürich', canton: 'ZH' }, { postalCode: '8006', name: 'Zürich', canton: 'ZH' },
  { postalCode: '8008', name: 'Zürich', canton: 'ZH' }, { postalCode: '8032', name: 'Zürich', canton: 'ZH' },
  { postalCode: '8050', name: 'Zürich', canton: 'ZH' }, { postalCode: '8051', name: 'Zürich', canton: 'ZH' },
  { postalCode: '8400', name: 'Winterthur', canton: 'ZH' }, { postalCode: '8404', name: 'Winterthur', canton: 'ZH' },
  { postalCode: '8600', name: 'Dübendorf', canton: 'ZH' }, { postalCode: '8610', name: 'Uster', canton: 'ZH' },
  { postalCode: '3000', name: 'Bern', canton: 'BE' }, { postalCode: '3001', name: 'Bern', canton: 'BE' },
  { postalCode: '3003', name: 'Bern', canton: 'BE' }, { postalCode: '3004', name: 'Bern', canton: 'BE' },
  { postalCode: '3005', name: 'Bern', canton: 'BE' }, { postalCode: '3006', name: 'Bern', canton: 'BE' },
  { postalCode: '3007', name: 'Bern', canton: 'BE' }, { postalCode: '3008', name: 'Bern', canton: 'BE' },
  { postalCode: '3010', name: 'Bern', canton: 'BE' }, { postalCode: '3011', name: 'Bern', canton: 'BE' },
  { postalCode: '3012', name: 'Bern', canton: 'BE' }, { postalCode: '3013', name: 'Bern', canton: 'BE' },
  { postalCode: '3014', name: 'Bern', canton: 'BE' }, { postalCode: '3015', name: 'Bern', canton: 'BE' },
  { postalCode: '3018', name: 'Bern', canton: 'BE' }, { postalCode: '3019', name: 'Bern', canton: 'BE' },
  { postalCode: '3020', name: 'Bern', canton: 'BE' }, { postalCode: '3027', name: 'Bern', canton: 'BE' },
  { postalCode: '3032', name: 'Hinterkappelen', canton: 'BE' }, { postalCode: '3600', name: 'Thun', canton: 'BE' },
  { postalCode: '2500', name: 'Biel', canton: 'BE' }, { postalCode: '2502', name: 'Biel', canton: 'BE' },
  { postalCode: '4001', name: 'Basel', canton: 'BS' }, { postalCode: '4002', name: 'Basel', canton: 'BS' },
  { postalCode: '4051', name: 'Basel', canton: 'BS' }, { postalCode: '4052', name: 'Basel', canton: 'BS' },
  { postalCode: '4053', name: 'Basel', canton: 'BS' }, { postalCode: '4054', name: 'Basel', canton: 'BS' },
  { postalCode: '4055', name: 'Basel', canton: 'BS' }, { postalCode: '4056', name: 'Basel', canton: 'BS' },
  { postalCode: '4057', name: 'Basel', canton: 'BS' }, { postalCode: '4058', name: 'Basel', canton: 'BS' },
  { postalCode: '4059', name: 'Basel', canton: 'BS' }, { postalCode: '4123', name: 'Allschwil', canton: 'BL' },
  { postalCode: '4125', name: 'Riehen', canton: 'BS' }, { postalCode: '4410', name: 'Liestal', canton: 'BL' },
  { postalCode: '1200', name: 'Genève', canton: 'GE' }, { postalCode: '1201', name: 'Genève', canton: 'GE' },
  { postalCode: '1202', name: 'Genève', canton: 'GE' }, { postalCode: '1203', name: 'Genève', canton: 'GE' },
  { postalCode: '1204', name: 'Genève', canton: 'GE' }, { postalCode: '1205', name: 'Genève', canton: 'GE' },
  { postalCode: '1206', name: 'Genève', canton: 'GE' }, { postalCode: '1207', name: 'Genève', canton: 'GE' },
  { postalCode: '1208', name: 'Genève', canton: 'GE' }, { postalCode: '1209', name: 'Genève', canton: 'GE' },
  { postalCode: '1000', name: 'Lausanne', canton: 'VD' }, { postalCode: '1003', name: 'Lausanne', canton: 'VD' },
  { postalCode: '1004', name: 'Lausanne', canton: 'VD' }, { postalCode: '1005', name: 'Lausanne', canton: 'VD' },
  { postalCode: '1006', name: 'Lausanne', canton: 'VD' }, { postalCode: '1007', name: 'Lausanne', canton: 'VD' },
  { postalCode: '1010', name: 'Lausanne', canton: 'VD' }, { postalCode: '1800', name: 'Vevey', canton: 'VD' },
  { postalCode: '1820', name: 'Montreux', canton: 'VD' }, { postalCode: '1400', name: 'Yverdon', canton: 'VD' },
  { postalCode: '6000', name: 'Luzern', canton: 'LU' }, { postalCode: '6003', name: 'Luzern', canton: 'LU' },
  { postalCode: '6004', name: 'Luzern', canton: 'LU' }, { postalCode: '6005', name: 'Luzern', canton: 'LU' },
  { postalCode: '9000', name: 'St. Gallen', canton: 'SG' }, { postalCode: '9001', name: 'St. Gallen', canton: 'SG' },
  { postalCode: '9004', name: 'St. Gallen', canton: 'SG' }, { postalCode: '9006', name: 'St. Gallen', canton: 'SG' },
  { postalCode: '6900', name: 'Lugano', canton: 'TI' }, { postalCode: '6901', name: 'Lugano', canton: 'TI' },
  { postalCode: '6902', name: 'Lugano', canton: 'TI' }, { postalCode: '6600', name: 'Locarno', canton: 'TI' },
  { postalCode: '5000', name: 'Aarau', canton: 'AG' }, { postalCode: '5001', name: 'Aarau', canton: 'AG' },
  { postalCode: '5400', name: 'Baden', canton: 'AG' }, { postalCode: '5600', name: 'Lenzburg', canton: 'AG' },
  { postalCode: '7000', name: 'Chur', canton: 'GR' }, { postalCode: '7001', name: 'Chur', canton: 'GR' },
  { postalCode: '7500', name: 'St. Moritz', canton: 'GR' }, { postalCode: '7260', name: 'Davos', canton: 'GR' },
  { postalCode: '8200', name: 'Schaffhausen', canton: 'SH' }, { postalCode: '8201', name: 'Schaffhausen', canton: 'SH' },
  { postalCode: '4500', name: 'Solothurn', canton: 'SO' }, { postalCode: '4501', name: 'Solothurn', canton: 'SO' },
  { postalCode: '2000', name: 'Neuchâtel', canton: 'NE' }, { postalCode: '2001', name: 'Neuchâtel', canton: 'NE' },
  { postalCode: '1700', name: 'Fribourg', canton: 'FR' }, { postalCode: '1701', name: 'Fribourg', canton: 'FR' },
  { postalCode: '1950', name: 'Sion', canton: 'VS' }, { postalCode: '1951', name: 'Sion', canton: 'VS' },
  { postalCode: '3900', name: 'Brig', canton: 'VS' }, { postalCode: '1870', name: 'Monthey', canton: 'VS' },
  { postalCode: '9050', name: 'Appenzell', canton: 'AI' }, { postalCode: '9100', name: 'Herisau', canton: 'AR' },
  { postalCode: '8500', name: 'Frauenfeld', canton: 'TG' }, { postalCode: '8501', name: 'Frauenfeld', canton: 'TG' },
  { postalCode: '6300', name: 'Zug', canton: 'ZG' }, { postalCode: '6301', name: 'Zug', canton: 'ZG' },
  { postalCode: '6430', name: 'Schwyz', canton: 'SZ' }, { postalCode: '6460', name: 'Altdorf', canton: 'UR' },
  { postalCode: '6060', name: 'Sarnen', canton: 'OW' }, { postalCode: '6370', name: 'Stans', canton: 'NW' },
  { postalCode: '8750', name: 'Glarus', canton: 'GL' }, { postalCode: '2800', name: 'Delémont', canton: 'JU' }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const lowerQuery = query.toLowerCase();
  const filtered = swissPlaces.filter(place =>
    place.postalCode.includes(lowerQuery) ||
    place.name.toLowerCase().includes(lowerQuery) ||
    place.canton.toLowerCase().includes(lowerQuery)
  );

  const results = filtered.slice(0, 10).map(place => ({
    postalCode: place.postalCode,
    name: place.name,
    canton: place.canton,
    label: `${place.postalCode} ${place.name}`
  }));

  return NextResponse.json(results);
}
