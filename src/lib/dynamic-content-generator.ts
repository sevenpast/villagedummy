import { getVisaStatus, getUserSegment } from '@/data/visaRequirements';

export interface UserProfile {
  country_of_origin?: string;
  has_children?: boolean;
  first_name?: string;
  last_name?: string;
}

export interface DynamicContent {
  infoBoxContent: string;
  variantName: string;
}

// Generate dynamic content for Task 1 (Residence Permit/Visa)
export function generateTask1Content(userProfile: UserProfile): DynamicContent {
  const country = userProfile.country_of_origin;
  const segment = getUserSegment(country || '');
  
  // Debug logging
  console.log('Task 1 - Country:', country, 'Segment:', segment);
  
  switch (segment) {
    case 'eu_efta':
      return {
        variantName: 'eu_efta',
        infoBoxContent: `Since you are a citizen of ${country}:

To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.

You will usually receive an L permit (short-term) or B permit (longer-term).

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).`
      };
      
    case 'visa_exempt':
      return {
        variantName: 'visa_exempt',
        infoBoxContent: `Since you are a citizen of ${country}:

- You may enter Switzerland without a visa and stay up to 90 days as a tourist.
- To live and work here, you need one of the following residence/work permits: L (short-term) or B (longer-term).
- Your Swiss employer must apply for this permit before you start work.
- Once approved, you can enter Switzerland visa-free and must register at your Gemeinde (municipality) within 14 days (see task Register at your Gemeinde (municipality)).`
      };
      
    case 'visa_required':
      return {
        variantName: 'visa_required',
        infoBoxContent: `Since you are a citizen of ${country}:

- Non-EU/EFTA citizens require a permit to live and work in Switzerland.
- Your Swiss employer must apply for a work permit on your behalf with the cantonal authorities.
- After your permit is approved by the canton and confirmed by the federal authorities (SEM), the Swiss embassy/consulate in your home country will issue you a D visa, which allows you to enter Switzerland to take up residence and employment.
- After arrival, you must register at your Gemeinde (municipality) within 14 days and you will then receive your permit card: L (short-term) or B (longer-term) (see task Register at your Gemeinde (municipality)).`
      };
      
    default:
      return {
        variantName: 'no_info',
        infoBoxContent: `You haven't shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic.

Would you like to complete your profile, so you get the most out of your experience on Village?`
      };
  }
}

// Generate dynamic content for Task 3 (Municipality Registration)
export function generateTask3Content(userProfile: UserProfile): DynamicContent {
  const country = userProfile.country_of_origin;
  const segment = getUserSegment(country || '');
  
  const commonDocuments = `Documents usually required at the Gemeinde (municipality):
- Passport/ID for each family member
- For families: documents on marital status (family book, marriage certificate, birth certificates, divorce certificate)
- Employment contract (with length and hours)
- Rental contract or landlord confirmation
- Passport photos (sometimes required)
- Proof of health insurance (or provide it within 3 months)`;

  const commonInfo = `Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.

${commonDocuments}`;

  switch (segment) {
    case 'eu_efta':
      return {
        variantName: 'eu_efta',
        infoBoxContent: `Since you are a citizen of ${country}:

To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.

You will usually receive an L permit (short-term) or B permit (longer-term).

${commonInfo}`
      };
      
    case 'visa_exempt':
      return {
        variantName: 'visa_exempt',
        infoBoxContent: `Since you are a citizen of ${country}:

To live and work in Switzerland, you must register at your Gemeinde (municipality) within 14 days of arrival after your residence/work permit has been approved.

At registration you will be issued your L (short-term) or B (longer-term) permit card.

${commonInfo}`
      };
      
    case 'visa_required':
      return {
        variantName: 'visa_required',
        infoBoxContent: `Since you are a citizen of ${country}:

After your employer's application is approved and the Swiss embassy issues your D visa, you may enter Switzerland.

Within 14 days of arrival, you must register at your Gemeinde (municipality).

You will then receive your L (short-term) or B (longer-term) permit card.

${commonInfo}`
      };
      
    default:
      return {
        variantName: 'no_info',
        infoBoxContent: `You haven't shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic.

Would you like to complete your profile, so you get the most out of your experience on Village?`
      };
  }
}

// Generate dynamic content for Task 4 (School Registration)
export function generateTask4Content(userProfile: UserProfile): DynamicContent {
  const hasChildren = userProfile.has_children;
  
  if (hasChildren === true) {
    return {
      variantName: 'with_children',
      infoBoxContent: `School registration is mandatory for all children aged 4-16 in Switzerland. You are seeing this task because your profile states that you have children. The registration process varies by canton and municipality, but typically requires: birth certificates, vaccination records, proof of residence, and sometimes language assessments. Contact your local school authority immediately after arrival to avoid delays.`
    };
  } else if (hasChildren === false) {
    return {
      variantName: 'without_children',
      infoBoxContent: `This task is not relevant for you. You can mark it as completed since your profile indicates you do not have children. School registration is only required for families with children aged 4-16.`
    };
  } else {
    return {
      variantName: 'unknown_children',
      infoBoxContent: `You are seeing this task because we don't know whether you have children. If you have children aged 4-16, school registration is mandatory in Switzerland. If you do not have children, you can mark this task as completed. Please update your profile to help us provide more personalized guidance.`
    };
  }
}

// Main function to get dynamic content for any task
export function getDynamicTaskContent(taskNumber: number, userProfile: UserProfile): DynamicContent {
  switch (taskNumber) {
    case 1:
      return generateTask1Content(userProfile);
    case 3:
      return generateTask3Content(userProfile);
    case 4:
      return generateTask4Content(userProfile);
    default:
      return {
        variantName: 'default',
        infoBoxContent: 'Please complete your profile to get personalized information.'
      };
  }
}
