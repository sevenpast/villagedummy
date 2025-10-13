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
        infoBoxContent: `- You may enter Switzerland without a visa and stay up to 90 days as a tourist.
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
  
  const commonInfo = `To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.

You will usually receive an L permit (short-term) or B permit (longer-term).

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.`;

  switch (segment) {
    case 'eu_efta':
      return {
        variantName: 'eu_efta',
        infoBoxContent: `Since you are a citizen of ${country}:

${commonInfo}`
      };
      
    case 'visa_exempt':
      return {
        variantName: 'visa_exempt',
        infoBoxContent: `Since you are a citizen of ${country}:

To live and work in Switzerland, you must register at your Gemeinde (municipality) within 14 days of arrival after your residence/work permit has been approved.

At registration you will be issued your L (short-term) or B (longer-term) permit card.

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.

Documents usually required at the Gemeinde (municipality):
-Passport/ID for each family member
-For families: documents on marital status (family book, marriage certificate, birth certificates)
-Employment contract (with length and hours)
-Rental contract or landlord confirmation
-Passport photos (sometimes required)
-Proof of health insurance (or provide it within 3 months)`
      };
      
    case 'visa_required':
      return {
        variantName: 'visa_required',
        infoBoxContent: `Since you are a citizen of ${country}:

After your employer's application is approved and the Swiss embassy issues your D visa, you may enter Switzerland.

Within 14 days of arrival, you must register at your Gemeinde (municipality).

You will then receive your L (short-term) or B (longer-term) permit card.

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.

Documents usually required at the Gemeinde (municipality):
-Passport/ID for each family member
-For families: documents on marital status (family book, marriage certificate, birth certificates)
-Employment contract (with length and hours)
-Rental contract or landlord confirmation
-Passport photos (sometimes required)
-Proof of health insurance (or provide it within 3 months)`
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
      infoBoxContent: `Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.

School attendance is compulsory from age 4–6 (varies slightly by canton).

Kindergarten usually starts at age 4 or 5 and is mandatory in most cantons (2 years before primary school).

Registration happens at your Gemeinde (municipality). They will assign a public school based on your home address (catchment system).

You may also apply to private or international schools, but these require direct application and tuition fees.

This task is shown to you because your profile states that you have children between the ages of 4 and 15. If that is incorrect, you can change your information here: change profile.`
    };
  } else if (hasChildren === false) {
    return {
      variantName: 'without_children',
      infoBoxContent: `Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.

School attendance is compulsory from age 4–6 (varies slightly by canton).

Kindergarten usually starts at age 4 or 5 and is mandatory in most cantons (2 years before primary school).

Registration happens at your Gemeinde (municipality). They will assign a public school based on your home address (catchment system).

You may also apply to private or international schools, but these require direct application and tuition fees.

This task is shown to you because your profile states that you have children between the ages of 4 and 15. If that is incorrect, you can change your information here: change profile.`
    };
  } else {
    return {
      variantName: 'unknown_children',
      infoBoxContent: `Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.

School attendance is compulsory from age 4–6 (varies slightly by canton).

Kindergarten usually starts at age 4 or 5 and is mandatory in most cantons (2 years before primary school).

Registration happens at your Gemeinde (municipality). They will assign a public school based on your home address (catchment system).

You may also apply to private or international schools, but these require direct application and tuition fees.

This task is shown to you because your profile states that you have children between the ages of 4 and 15. If that is incorrect, you can change your information here: change profile.`
    };
  }
}

// Generate dynamic content for Task 5
export function generateTask5Content(userProfile: UserProfile): DynamicContent {
  return {
    variantName: 'all_users',
    infoBoxContent: `After you register at your Gemeinde, your data goes to the cantonal migration office.

You'll receive a letter which requires a signature upon receipt. Missing the delivery means you'll have to pick it up at the post office. The letter will to provide an appointment to collect biometric data (fingerprints + photo). Appointments are given usually within the first 1–2 weeks after registration.

After biometrics, the permit card (plastic ID card) is produced by the federal authorities and sent to your Swiss address by registered post.

Processing can take 2–8 weeks depending on canton.

Children also receive a card and are required to provide data at the appointment (no fingerprints for younger kids). 

This card is needed for many admin tasks (opening bank account, long-term housing, some insurances, travel).

Fees: usually around CHF 60 - 150 per adult, depending on the canton and permit type`
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
    case 5:
      return generateTask5Content(userProfile);
    default:
      return {
        variantName: 'default',
        infoBoxContent: 'Please complete your profile to get personalized information.'
      };
  }
}
