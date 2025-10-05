// Swiss postal codes from official swisstopo data
export interface PostalCodeData {
  postalCode: string;
  city: string;
  canton: string;
  cantonCode: string;
  municipality: string;
  addition: string;
  bfsNumber: string;
  language: string;
  validity: string;
}

export const swissPostalCodes: PostalCodeData[] = [
  {
    postalCode: '8914',
    city: 'Aeugst am Albis',
    canton: 'Zürich',
    cantonCode: 'ZH',
    municipality: 'Aeugst am Albis',
    addition: '00',
    bfsNumber: '1',
    language: 'de',
    validity: '2008-07-01'
  },
  {
    postalCode: '8914',
    city: 'Aeugstertal',
    canton: 'Zürich',
    cantonCode: 'ZH',
    municipality: 'Aeugst am Albis',
    addition: '02',
    bfsNumber: '1',
    language: 'de',
    validity: '2008-07-01'
  },
  {
    postalCode: '8909',
    city: 'Zwillikon',
    canton: 'Zürich',
    cantonCode: 'ZH',
    municipality: 'Affoltern am Albis',
    addition: '00',
    bfsNumber: '2',
    language: 'de',
    validity: '2008-07-01'
  },
  {
    postalCode: '8910',
    city: 'Affoltern am Albis',
    canton: 'Zürich',
    cantonCode: 'ZH',
    municipality: 'Affoltern am Albis',
    addition: '00',
    bfsNumber: '2',
    language: 'de',
    validity: '2008-07-01'
  },
  {
    postalCode: '8906',
    city: 'Bonstetten',
    canton: 'Zürich',
    cantonCode: 'ZH',
    municipality: 'Bonstetten',
    addition: '00',
    bfsNumber: '3',
    language: 'de',
    validity: '2008-07-01'
  },
  {
    postalCode: '6340',
    city: 'Sihlbrugg',
    canton: 'Zürich',
    cantonCode: 'ZH',
    municipality: 'Hausen am Albis',
    addition: '04',
    bfsNumber: '4',
    language: 'de',
    validity: '2008-07-01'
  },
  {
    postalCode: '8915',
    city: 'Hausen am Albis',
    canton: 'Zürich',
    cantonCode: 'ZH',
    municipality: 'Hausen am Albis',
    addition: '00',
    bfsNumber: '4',
    language: 'de',
    validity: '2008-07-01'
  },
  {
    postalCode: '8925',
    city: 'Ebertswil',
    canton: 'Zürich',
    cantonCode: 'ZH',
    municipality: 'Hausen am Albis',
    addition: '00',
    bfsNumber: '4',
    language: 'de',
