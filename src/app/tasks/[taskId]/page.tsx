'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* 
 * Task Detail Page Component
 * Handles individual task workflows and step-by-step guidance
 * Each task has its own specialized workflow logic
 */
const allTasks = [
  {
    id: 'secure_visa',
    title: 'Secure residence permit / visa',
    description: 'Apply for the necessary residence permit or visa before entering Switzerland',
    priority: 'high',
    category: 'visa',
    content: {
      intro: 'As a non-EU/EFTA citizen, you need to secure a residence permit or visa before entering Switzerland.',
      steps: [
        'Check visa requirements for your country of origin',
        'Gather required documents (passport, employment contract, etc.)',
        'Submit application to Swiss embassy/consulate in your country',
        'Wait for approval (processing time varies by country)',
        'Enter Switzerland with approved visa/permit'
      ],
      requirements: [
        'Valid passport',
        'Employment contract or job offer',
        'Proof of accommodation',
        'Health insurance certificate',
        'Financial proof of means'
      ],
      estimatedTime: '2-8 weeks',
      importantNotes: [
        'Processing times vary significantly by country',
        'Some countries require biometric data collection',
        'Work permits are often tied to specific employers',
        'Family members may need separate applications'
      ]
    }
  },
  {
    id: 'find_housing',
    title: 'Find housing',
    description: 'Search for and secure accommodation in your target location',
    priority: 'high',
    category: 'housing',
    content: {
      intro: 'Finding suitable housing in Switzerland can be challenging due to high demand and limited availability.',
      steps: [
        'Research housing market in your target area',
        'Set up accounts on major rental platforms (Homegate, ImmoScout24)',
        'Prepare application documents (salary certificate, references)',
        'Visit properties and submit applications',
        'Sign rental agreement and pay deposits'
      ],
      requirements: [
        'Salary certificate (3x monthly rent)',
        'Employment contract',
        'Previous landlord references',
        'Identity documents',
        'Deposit (usually 1-3 months rent)'
      ],
      estimatedTime: '1-3 months',
      importantNotes: [
        'Competition for housing is very high',
        'Be prepared to pay 1-3 months rent as deposit',
        'Some areas require Swiss guarantors',
        'Furnished apartments are more expensive but easier to find'
      ]
    }
  },
  {
    id: 'register_gemeinde',
    title: 'Register at your Gemeinde (municipality)',
    description: 'Register your residence with the local municipality within 14 days of arrival',
    priority: 'high',
    category: 'registration',
    content: {
      intro: 'All residents must register with their local municipality within 14 days of arrival in Switzerland.',
      steps: [
        'Find your local municipality office (Gemeinde)',
        'Make an appointment for registration',
        'Gather required documents',
        'Attend registration appointment',
        'Receive confirmation of registration'
      ],
      requirements: [
        'Valid passport or ID card',
        'Rental agreement or proof of accommodation',
        'Employment contract or proof of income',
        'Health insurance certificate',
        'Marriage certificate (if applicable)',
        'Birth certificates of children (if applicable)'
      ],
      estimatedTime: '1-2 hours',
      importantNotes: [
        'Registration must be done within 14 days of arrival',
        'Bring all family members to the appointment',
        'Some municipalities require appointments',
        'Registration is free of charge'
      ]
    }
  },
  {
    id: 'register_school',
    title: 'Register for school/kindergarten',
    description: 'Register your children for school or kindergarten',
    priority: 'medium',
    category: 'family',
    content: {
      intro: 'Children in Switzerland are required to attend school from age 4-5. Registration should be done as soon as possible.',
      steps: [
        'Contact your local school district office',
        'Gather required documents for each child',
        'Submit registration forms',
        'Attend school placement assessment (if required)',
        'Receive school assignment and start date'
      ],
      requirements: [
        'Child\'s birth certificate (translated if not in German/French/Italian)',
        'Proof of residence registration',
        'Health insurance certificate',
        'Vaccination records',
        'Previous school records (if applicable)',
        'Parent\'s identity documents'
      ],
      estimatedTime: '1-2 weeks',
      importantNotes: [
        'School registration is mandatory for all children',
        'Some schools have waiting lists',
        'Language support may be available for non-native speakers',
        'School year starts in August'
      ]
    }
  },
  {
    id: 'receive_permit_card',
    title: 'Receive residence permit card',
    description: 'Collect your residence permit card from the cantonal migration office',
    priority: 'medium',
    category: 'permit',
    content: {
      intro: 'After successful registration and processing, you will receive your residence permit card from the cantonal migration office.',
      steps: [
        'Wait for notification from migration office',
        'Schedule appointment to collect permit card',
        'Bring required documents to appointment',
        'Have biometric data collected (photo, fingerprints)',
        'Receive residence permit card'
      ],
      requirements: [
        'Valid passport',
        'Registration confirmation from municipality',
        'Employment contract',
        'Health insurance certificate',
        'Proof of address'
      ],
      estimatedTime: '2-4 weeks after registration',
      importantNotes: [
        'Permit card is required for many official procedures',
        'Biometric data collection is mandatory',
        'Card is valid for the duration of your permit',
        'Keep the card safe - replacement is expensive'
      ]
    }
  }
];

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Core state management
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [task, setTask] = useState<any>(null);

  // Helper function for user-specific task completion tracking
  const getUserSpecificKey = (user: any) => {
    return user?.first_name ? `expatvillage_completed_tasks_${user.first_name}` : 'expatvillage_completed_tasks';
  };

  const markTaskAsCompleted = (taskId: string) => {
    const userKey = getUserSpecificKey(currentUser);
    const completedTasks = JSON.parse(localStorage.getItem(userKey) || '[]');
    if (!completedTasks.includes(taskId)) {
      completedTasks.push(taskId);
      localStorage.setItem(userKey, JSON.stringify(completedTasks));
    }
  };
  
  // Workflow step states - each task has its own progression
  const [workflowStep, setWorkflowStep] = useState<'intro' | 'info' | 'question' | 'search' | 'toppicks' | 'application' | 'completed'>('intro');
  const [gemeindeWorkflowStep, setGemeindeWorkflowStep] = useState<'intro' | 'info' | 'question' | 'opening-hours' | 'email' | 'reminder' | 'completed'>('intro');
  const [schoolWorkflowStep, setSchoolWorkflowStep] = useState<'intro' | 'question' | 'research' | 'pdf-form' | 'online-portal' | 'fallback-email' | 'reminder' | 'completed'>('intro');
  const [permitWorkflowStep, setPermitWorkflowStep] = useState<'intro' | 'info' | 'question' | 'time-check' | 'email-generator' | 'reminder' | 'completed'>('intro');
  
  // Task-specific data
  const [hasWorkPermit, setHasWorkPermit] = useState<boolean | null>(null);
  
  // Housing form state
  const [housingForm, setHousingForm] = useState({
    type: '',
    budget: '',
    size: '',
    location: '',
    wheelchair: false,
    parking: false,
    pets: false,
    availability: ''
  });

  useEffect(() => {
    // Initialize user data from localStorage (fallback authentication)
    const userData = localStorage.getItem('expatvillage_current_user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    // Locate specific task by URL parameter
    const taskId = params.taskId as string;
    const foundTask = allTasks.find(t => t.id === taskId);
    setTask(foundTask);
  }, [params.taskId]);

  const handleBackClick = () => {
    router.push('/');
  };

  /* 
   * Task 1 workflow progression handler
   * Manages step transitions based on user responses
   */
  const handleNextStep = () => {
    switch (workflowStep) {
      case 'intro':
        setWorkflowStep('info');
        break;
      case 'info':
        setWorkflowStep('question');
        break;
      case 'question':
        // Branch based on permit status
        if (hasWorkPermit === true) {
          setWorkflowStep('completed');
        } else {
          setWorkflowStep('reminder');
        }
        break;
      case 'reminder':
        setWorkflowStep('completed');
        break;
    }
  };

  const handlePermitResponse = (hasPermit: boolean) => {
    setHasWorkPermit(hasPermit);
    handleNextStep();
  };

  /* 
   * Visa requirement checker based on country of origin
   * Note: This is a simplified list - real implementation should use official sources
   */
  const isVisaRequired = (country: string) => {
    // Deduplicated list of non-EU/EFTA countries requiring visas for Switzerland
    const visaRequiredCountries = ['IN', 'CN', 'BR', 'RU', 'UA', 'PK', 'BD', 'NG', 'EG', 'MA', 'TN', 'DZ', 'LY', 'SD', 'ET', 'KE', 'UG', 'TZ', 'GH', 'CI', 'SN', 'ML', 'BF', 'NE', 'TD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ZM', 'ZW', 'BW', 'NA', 'SZ', 'LS', 'MG', 'MU', 'SC', 'KM', 'YT', 'RE', 'MZ', 'MW'];
    return visaRequiredCountries.includes(country);
  };

  const getCountryName = (countryCode: string) => {
    const countryNames: { [key: string]: string } = {
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'AT': 'Austria',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'NO': 'Norway',
      'IS': 'Iceland',
      'LI': 'Liechtenstein',
      'US': 'United States',
      'CA': 'Canada',
      'GB': 'United Kingdom',
      'AU': 'Australia',
      'NZ': 'New Zealand',
      'JP': 'Japan',
      'KR': 'South Korea',
      'IN': 'India',
      'BR': 'Brazil',
      'AR': 'Argentina',
      'MX': 'Mexico',
      'CN': 'China',
      'TW': 'Taiwan',
      'SG': 'Singapore',
      'HK': 'Hong Kong',
      'MY': 'Malaysia',
      'TH': 'Thailand',
      'PH': 'Philippines',
      'ID': 'Indonesia',
      'VN': 'Vietnam',
      'RU': 'Russia',
      'UA': 'Ukraine',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'HU': 'Hungary',
      'RO': 'Romania',
      'BG': 'Bulgaria',
      'HR': 'Croatia',
      'SI': 'Slovenia',
      'SK': 'Slovakia',
      'LT': 'Lithuania',
      'LV': 'Latvia',
      'EE': 'Estonia',
      'FI': 'Finland',
      'SE': 'Sweden',
      'DK': 'Denmark',
      'IE': 'Ireland',
      'PT': 'Portugal',
      'GR': 'Greece',
      'CY': 'Cyprus',
      'MT': 'Malta',
      'LU': 'Luxembourg',
      'ZA': 'South Africa',
      'EG': 'Egypt',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'MA': 'Morocco',
      'TN': 'Tunisia',
      'IL': 'Israel',
      'TR': 'Turkey',
      'SA': 'Saudi Arabia',
      'AE': 'United Arab Emirates',
      'QA': 'Qatar',
      'KW': 'Kuwait',
      'BH': 'Bahrain',
      'OM': 'Oman',
      'JO': 'Jordan',
      'LB': 'Lebanon',
      'OTHER': 'Other'
    };
    return countryNames[countryCode] || countryCode;
  };

  /* 
   * Housing market price estimation algorithm
   * Calculates affordability based on location, size, and budget
   */
  const calculateRentEstimation = () => {
    // Require all essential form fields
    if (!housingForm.budget || !housingForm.size || !housingForm.location) {
      return null;
    }

    const budget = parseInt(housingForm.budget);
    const size = parseFloat(housingForm.size);
    const location = housingForm.location.toLowerCase();

    // Market pricing logic - simplified regional model
    let basePrice = 0;
    let marketMultiplier = 1;

    // Base price per room
    if (location.includes('zurich')) {
      basePrice = 800;
      marketMultiplier = 1.2;
    } else if (location.includes('geneva')) {
      basePrice = 750;
      marketMultiplier = 1.15;
    } else if (location.includes('basel')) {
      basePrice = 700;
      marketMultiplier = 1.1;
    } else {
      basePrice = 600;
      marketMultiplier = 1.0;
    }

    // Calculate estimated market price
    const estimatedPrice = Math.round(size * basePrice * marketMultiplier);
    const priceDifference = estimatedPrice - budget;
    const percentageOver = (priceDifference / budget) * 100;

    return {
      estimatedPrice,
      budget,
      percentageOver,
      isGoodFit: percentageOver < 50,
      isTightMarket: percentageOver >= 50
    };
  };

  // Real-time housing data scraping state
  const [scrapedPicks, setScrapedPicks] = useState<any[]>([]);
  const [isScraping, setIsScraping] = useState(false);

  /* 
   * Fallback housing recommendations generator
   * Creates mock listings when real data scraping fails
   */
  const generateFallbackPicks = () => {
    if (!housingForm.budget || !housingForm.size || !housingForm.location) {
      return [];
    }

    const budget = parseInt(housingForm.budget);
    const size = parseFloat(housingForm.size);
    const location = housingForm.location.toLowerCase();
    const type = housingForm.type;
    const hasParking = housingForm.parking;
    const hasPets = housingForm.pets;
    const isWheelchair = housingForm.wheelchair;

    // Generate 3 AI picks based on criteria
    const picks = [];

    // Pick 1: Budget-friendly option
    const budgetPrice = Math.round(budget * 0.85);
    picks.push({
      id: 1,
      title: `${size} room apartment in ${location.split(',')[0]}`,
      price: budgetPrice,
      size: `${size} rooms`,
      location: location.split(',')[0],
      features: [
        'Modern kitchen',
        'Balcony',
        hasParking ? 'Parking included' : 'Street parking available',
        hasPets ? 'Pets allowed' : 'No pets policy',
        isWheelchair ? 'Wheelchair accessible' : 'Ground floor available'
      ].filter(f => f),
      description: `Perfect starter home in ${location.split(',')[0]}. Well-connected to public transport and close to amenities.`,
      matchScore: 95,
      availability: 'Available now',
      link: `https://www.homegate.ch/mieten/immobilie/${location.split(',')[0].toLowerCase()}/trefferliste?rooms=${size}&price=${budgetPrice}&pets=${hasPets ? 'true' : 'false'}&parking=${hasParking ? 'true' : 'false'}`,
      portal: 'homegate'
    });

    // Pick 2: Mid-range option
    const midPrice = Math.round(budget * 1.1);
    picks.push({
      id: 2,
      title: `Spacious ${size} room flat with garden access`,
      price: midPrice,
      size: `${size} rooms`,
      location: location.split(',')[0],
      features: [
        'Renovated kitchen',
        'Private garden access',
        'Storage room',
        hasParking ? 'Underground parking' : 'Parking available nearby',
        hasPets ? 'Pet-friendly building' : 'Pet-free building',
        isWheelchair ? 'Full accessibility' : 'Elevator available'
      ].filter(f => f),
      description: `Charming apartment with character in a quiet neighborhood. Excellent for ${type === 'permanent' ? 'long-term living' : 'temporary stay'}.`,
      matchScore: 88,
      availability: 'Available in 2 weeks',
      link: `https://www.immoscout24.ch/mieten/wohnung/${location.split(',')[0].toLowerCase()}?rooms=${size}&price=${midPrice}&garden=true&pets=${hasPets ? 'true' : 'false'}`,
      portal: 'immoscout24'
    });

    // Pick 3: Premium option
    const premiumPrice = Math.round(budget * 1.3);
    picks.push({
      id: 3,
      title: `Luxury ${size} room penthouse with city views`,
      price: premiumPrice,
      size: `${size} rooms`,
      location: location.split(',')[0],
      features: [
        'High-end kitchen appliances',
        'Panoramic city views',
        'Rooftop terrace',
        hasParking ? 'Private garage' : 'Valet parking service',
        hasPets ? 'Pet spa on-site' : 'Pet-free luxury building',
        isWheelchair ? 'Full accessibility with smart home features' : 'Smart home system'
      ].filter(f => f),
      description: `Exclusive living experience in the heart of ${location.split(',')[0]}. Perfect for professionals seeking comfort and convenience.`,
      matchScore: 82,
      availability: 'Available in 1 month',
      link: `https://www.newhome.ch/mieten/wohnung/${location.split(',')[0].toLowerCase()}?rooms=${size}&price=${premiumPrice}&luxury=true&terrace=true`,
      portal: 'newhome'
    });

    return picks;
  };

  /* 
   * Real housing data scraper
   * Fetches live listings from Swiss rental portals
   */
  const scrapeRealHousingData = async () => {
    // Validate form completion before scraping
    if (!housingForm.budget || !housingForm.size || !housingForm.location) {
      return [];
    }

    setIsScraping(true);
    try {
      const response = await fetch('/api/scrape-housing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget: housingForm.budget,
          size: housingForm.size,
          location: housingForm.location,
          hasParking: housingForm.parking,
          hasPets: housingForm.pets,
          isWheelchair: housingForm.wheelchair
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScrapedPicks(data.results || []);
        return data.results || [];
      } else {
        console.error('Scraping failed:', response.statusText);
        return generateFallbackPicks();
      }
    } catch (error) {
      console.error('Scraping error:', error);
      return generateFallbackPicks();
    } finally {
      setIsScraping(false);
    }
  };

  // Get top picks (real data or fallback)
  const getTopPicks = () => {
    if (scrapedPicks.length > 0) {
      return scrapedPicks;
    }
    return generateFallbackPicks();
  };

  /* 
   * ============================================================================
   * TASK 3: GEMEINDE REGISTRATION WORKFLOW FUNCTIONS
   * ============================================================================
   * Critical 14-day deadline task with personalized content based on citizenship
   */
  const renderGemeindeIntroStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Register at your Gemeinde (municipality)</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-gray-800 text-lg leading-relaxed">
            All residents must register with their local municipality within 14 days of arrival in Switzerland.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => setGemeindeWorkflowStep('info')}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderGemeindeInfoStep = () => {
    // Extract user citizenship data for personalization
    const countryOfOrigin = currentUser?.country_of_origin;
    const countryName = countryOfOrigin ? getCountryName(countryOfOrigin) : null;
    const isEUEFTA = currentUser?.is_eu_efta_citizen;

    // Dynamic content renderer based on citizenship status
    const renderPersonalizedContent = () => {
      if (!countryOfOrigin) {
        return (
          <p className="text-gray-800 mb-4">
            You haven't shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic.
          </p>
        );
      }

      if (isEUEFTA) {
        return (
          <div>
            <p className="text-gray-800 mb-4">
              Since you are a citizen of <strong>{countryName}</strong>:
            </p>
            <p className="text-gray-800 mb-4">
              To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.
            </p>
            <p className="text-gray-800 mb-4">
              You will usually receive an L permit (short-term) or B permit (longer-term).
            </p>
            <p className="text-gray-800 mb-4">
              Registration is mandatory for access to services (insurance, bank account, schooling, etc.).
            </p>
            <p className="text-gray-800 mb-4">
              Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.
            </p>
          </div>
        );
      } else {
        return (
          <div>
            <p className="text-gray-800 mb-4">
              Since you are a citizen of <strong>{countryName}</strong>:
            </p>
            <p className="text-gray-800 mb-4">
              After your employer's application is approved and the Swiss embassy issues your D visa, you may enter Switzerland.
            </p>
            <p className="text-gray-800 mb-4">
              Within 14 days of arrival, you must register at your Gemeinde (municipality).
            </p>
            <p className="text-gray-800 mb-4">
              You will then receive your L (short-term) or B (longer-term) permit card.
            </p>
            <p className="text-gray-800 mb-4">
              Registration is mandatory for access to services (insurance, bank account, schooling, etc.).
            </p>
            <p className="text-gray-800 mb-4">
              Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.
            </p>
          </div>
        );
      }
    };

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Make your residence official within 14 days of arrival</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          {renderPersonalizedContent()}
          {!countryOfOrigin && (
            <div className="mt-4">
              <p className="text-gray-800 mb-4">
                Would you like to complete your profile, so you get the most out of your experience on Village?
              </p>
              <button
                onClick={() => router.push('/profile/settings')}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Complete Profile
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Documents usually required at the Gemeinde (municipality):</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-800">
            <li>Passport/ID for each family member</li>
            <li>For families: documents on marital status (family book, marriage certificate, birth certificates)</li>
            <li>Employment contract (with length and hours)</li>
            <li>Rental contract or landlord confirmation</li>
            <li>Passport photos (sometimes required)</li>
            <li>Proof of health insurance (or provide it within 3 months)</li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={() => setGemeindeWorkflowStep('question')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderGemeindeQuestionStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Have you already registered yourself?</h2>
        
        <div className="text-center space-y-3">
          <button
              onClick={() => {
                // Mark task as completed and store completion timestamp
                markTaskAsCompleted('register_gemeinde');
                // Critical: Store completion date for Task 5's 3-week time check
                const userKey = getUserSpecificKey(currentUser);
                localStorage.setItem(`expatvillage_gemeinde_completed_date_${currentUser?.first_name || 'default'}`, new Date().toISOString());
                setGemeindeWorkflowStep('completed');
              }}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Yes
          </button>
          
          <button
            onClick={() => setGemeindeWorkflowStep('opening-hours')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Not yet
          </button>
        </div>
      </div>
    );
  };

  const renderGemeindeOpeningHoursStep = () => {
    const targetCanton = currentUser?.target_canton;
    const cantonName = targetCanton ? getCountryName(targetCanton) : 'your municipality';
    
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Municipality Opening Hours</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Opening Hours for {cantonName}:</h3>
          <p className="text-gray-800 mb-4">
            The customer services of the municipal administration have different opening hours. They are tailored to the needs of their customers.
          </p>
          <p className="text-gray-800 mb-4">
            Please note the information on the corresponding websites.
          </p>
          <div className="mt-4">
            <a 
              href="https://www.stadt-zuerich.ch/de/politik-und-verwaltung/stadtverwaltung/oeffnungszeiten.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 inline-block"
            >
              View Opening Hours
            </a>
          </div>
        </div>

      </div>
    );
  };


  const renderGemeindeEmailStep = () => {
    const targetCanton = currentUser?.target_canton || 'your target location';
    const language = targetCanton.toLowerCase().includes('zurich') || targetCanton.toLowerCase().includes('bern') ? 'German' : 'French';
    
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Generator</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-gray-800">
            <strong>Fallback activated:</strong> Could not find complete information online. 
            Use this email to request the official document list directly from your municipality.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Generated Email ({language}):</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Subject:</strong> Registration Requirements - New Resident
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {language === 'German' ? 
                `Sehr geehrte Damen und Herren,

ich bin ein neuer Einwohner in Ihrer Gemeinde und möchte mich gemäß den gesetzlichen Bestimmungen innerhalb von 14 Tagen anmelden.

Könnten Sie mir bitte eine vollständige Liste der erforderlichen Dokumente und die anfallenden Gebühren zusenden?

Vielen Dank für Ihre Hilfe.

Mit freundlichen Grüßen
${currentUser?.first_name || 'Your Name'}` :
                `Madame, Monsieur,

Je suis un nouveau résident dans votre commune et je souhaite m'inscrire conformément aux dispositions légales dans les 14 jours.

Pourriez-vous m'envoyer une liste complète des documents requis et des frais applicables ?

Merci pour votre aide.

Cordialement
${currentUser?.first_name || 'Your Name'}`
              }
            </p>
          </div>
        </div>

        <div className="text-center space-y-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                language === 'German' ? 
                `Sehr geehrte Damen und Herren,

ich bin ein neuer Einwohner in Ihrer Gemeinde und möchte mich gemäß den gesetzlichen Bestimmungen innerhalb von 14 Tagen anmelden.

Könnten Sie mir bitte eine vollständige Liste der erforderlichen Dokumente und die anfallenden Gebühren zusenden?

Vielen Dank für Ihre Hilfe.

Mit freundlichen Grüßen
${currentUser?.first_name || 'Your Name'}` :
                `Madame, Monsieur,

Je suis un nouveau résident dans votre commune et je souhaite m'inscrire conformément aux dispositions légales dans les 14 jours.

Pourriez-vous m'envoyer une liste complète des documents requis et des frais applicables ?

Merci pour votre aide.

Cordialement
${currentUser?.first_name || 'Your Name'}`
              );
            }}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Copy Email to Clipboard
          </button>
          <button
            onClick={() => setGemeindeWorkflowStep('reminder')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Set Reminder
          </button>
        </div>
      </div>
    );
  };

  const renderGemeindeReminderStep = () => {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Reminder</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-gray-800 font-medium">⚠️ URGENT: 14-day deadline</p>
          <p className="text-gray-700 text-sm">
            You must register within 14 days of arrival. Missing this deadline can result in fines.
          </p>
        </div>

        <p className="text-gray-700 mb-6">
          We'll remind you 2 days from now to ensure you don't miss your deadline.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              // Set reminder (simulate)
              alert('Reminder set for 2 days from now');
              setGemeindeWorkflowStep('completed');
            }}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Set 2-Day Reminder
          </button>
          
          <button
            onClick={() => setGemeindeWorkflowStep('completed')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Skip Reminder
          </button>
        </div>
      </div>
    );
  };

  const renderGemeindeCompletedStep = () => {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Completed!</h2>
          <p className="text-gray-600">
            You have successfully registered with your municipality.
          </p>
        </div>
        <button
          onClick={handleBackClick}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Home
        </button>
      </div>
    );
  };

  /* 
   * ============================================================================
   * TASK 4: SCHOOL REGISTRATION WORKFLOW FUNCTIONS
   * ============================================================================
   * Adaptive workflow that adjusts based on user's family status
   */
  const renderSchoolIntroStep = () => {
    // Determine family status for content personalization
    const hasChildren = currentUser?.has_children && currentUser?.children_count > 0;
    
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Register for school/kindergarten</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          {hasChildren ? (
            <div>
              <p className="text-gray-800 mb-4">
                <strong>Shown to: with kids</strong> → Register your kids for school right after arrival.
              </p>
              <p className="text-gray-800 mb-4">
                Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-800 mb-4">
                You are seeing this task, because we don't know whether you have children. For a more tailored experience, please complete your profile.
              </p>
              <p className="text-gray-800 mb-4">
                Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.
              </p>
            </div>
          )}
          
          <div className="space-y-3 text-gray-800">
            <p>School attendance is compulsory from age 4–6 (varies slightly by canton).</p>
            <p>Kindergarten usually starts at age 4 or 5 and is mandatory in most cantons (2 years before primary school).</p>
            <p>Registration happens at your Gemeinde (municipality). They will assign a public school based on your home address (catchment system).</p>
            <p>You may also apply to private or international schools, but these require direct application and tuition fees.</p>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Documents usually required:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              <li>Child's passport/ID</li>
              <li>Birth certificate</li>
              <li>Residence permit (if available)</li>
              <li>Proof of address (rental contract or confirmation)</li>
              <li>Immunization/vaccination record</li>
              <li>Previous school reports (if available)</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setSchoolWorkflowStep('question')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderSchoolQuestionStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Register for school/kindergarten</h2>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Have you already registered your child(ren) for school yet?</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                // Mark task as completed
                markTaskAsCompleted('register_school');
                setSchoolWorkflowStep('completed');
              }}
              className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
            >
              Yes
            </button>
            
            <button
              onClick={() => setSchoolWorkflowStep('research')}
              className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
            >
              Not yet
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSchoolResearchStep = () => {
    const targetCanton = currentUser?.target_canton;
    const cantonName = targetCanton ? getCountryName(targetCanton) : 'your municipality';
    
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">School Registration Research</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Show opening hours, and official page (Schulverwaltung) for municipality shared in profile.</h3>
          <p className="text-gray-800 mb-4">
            Check the specific requirements for <strong>{cantonName}</strong>
          </p>
          <div className="mt-4">
            <a 
              href="https://www.stadt-zuerich.ch/de/politik-und-verwaltung/stadtverwaltung/oeffnungszeiten.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 inline-block"
            >
              View School Administration Hours
            </a>
          </div>
        </div>

      </div>
    );
  };

  const renderSchoolPdfFormStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">PDF Form Assistant</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">[If a PDF form is required]:</h3>
          <p className="text-gray-800 mb-4">
            → Auto-fill form with whatever data was shared in profile in English with our overlay.
          </p>
          <p className="text-gray-800 mb-4">
            → Show a preview to complete/edit and approve, then give options:
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Child's Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Enter child's full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Previous School (if applicable)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Name of previous school"
              />
            </div>
          </div>
        </div>

        <div className="text-center space-y-3">
          <button
            onClick={() => setSchoolWorkflowStep('reminder')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            1) Download the completed PDF in both English and Local language
          </button>
          
          <button
            onClick={() => setSchoolWorkflowStep('reminder')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            2) Ready-to-send-Email to school office (local language; English copy for reference, cc to user)
          </button>
        </div>
      </div>
    );
  };

  const renderSchoolOnlinePortalStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Online Portal Assistant</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Online Registration Portal</h3>
          <p className="text-gray-800 mb-4">
            We found an online registration portal for your area. Here's how to proceed:
          </p>
          
          <div className="mt-4">
            <a 
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 inline-block"
            >
              Open Online Portal
            </a>
          </div>
          
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h4 className="font-semibold text-gray-900 mb-2">Your Profile Data (Copy & Paste):</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Name:</strong> {currentUser?.first_name} {currentUser?.last_name}</p>
              <p><strong>Address:</strong> [Your current address]</p>
              <p><strong>Phone:</strong> [Your phone number]</p>
              <p><strong>Email:</strong> [Your email]</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setSchoolWorkflowStep('reminder')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderSchoolFallbackEmailStep = () => {
    const targetCanton = currentUser?.target_canton;
    const language = targetCanton?.toLowerCase().includes('zurich') || targetCanton?.toLowerCase().includes('bern') ? 'German' : 'French';
    
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Generator</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">[If no clear info online]</h3>
          <p className="text-gray-800 mb-4">
            → offer a ready-to-send email (local language) to the school office asking for the checklist + form link.
          </p>
          
          <div className="bg-white border border-gray-200 rounded-md p-4 text-sm">
            <p className="text-gray-700 mb-2"><strong>To:</strong> schulverwaltung@[your-municipality].ch</p>
            <p className="text-gray-700 mb-2"><strong>Subject:</strong> School Registration Inquiry</p>
            <div className="text-gray-700">
              <p className="mb-2">Dear School Administration,</p>
              <p className="mb-2">I am writing to inquire about the school registration process for my child(ren).</p>
              <p className="mb-2">Could you please provide me with information about:</p>
              <ul className="list-disc list-inside ml-4 mb-2">
                <li>Required documents for registration</li>
                <li>Registration deadlines</li>
                <li>Available appointment times</li>
                <li>Any specific forms that need to be completed</li>
              </ul>
              <p className="mb-2">Thank you for your assistance.</p>
              <p>Best regards,<br/>{currentUser?.first_name} {currentUser?.last_name}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              navigator.clipboard.writeText(document.querySelector('.bg-white.border')?.textContent || '');
              alert('Email copied to clipboard!');
            }}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Copy Email to Clipboard
          </button>
        </div>
      </div>
    );
  };

  const renderSchoolReminderStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Reminder</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Reminder?</h3>
          <p className="text-gray-800 mb-4">
            → Shall we send you a reminder in 2 days?
          </p>
          <p className="text-gray-800 mb-4">
            <strong>Don't delay! School registration is mandatory immediately after arrival.</strong>
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" defaultChecked />
              <span className="text-gray-800">Send reminder in 2 days</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" />
              <span className="text-gray-800">Send reminder 1 week before deadline</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" />
              <span className="text-gray-800">Send reminder 3 days before deadline</span>
            </label>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              // Mark task as completed
              markTaskAsCompleted('register_school');
              setSchoolWorkflowStep('completed');
            }}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Set Reminder & Complete
          </button>
        </div>
      </div>
    );
  };

  const renderSchoolCompletedStep = () => {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-800">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Completed!</h2>
          <p className="text-gray-600">School registration process completed successfully.</p>
        </div>
        
        <button
          onClick={() => router.push('/')}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
        >
          Home
        </button>
      </div>
    );
  };

  /* 
   * ============================================================================
   * TASK 5: RESIDENCE PERMIT CARD WORKFLOW FUNCTIONS
   * ============================================================================
   * Final step in permit process with time-based logic and automated reminders
   */
  const renderPermitIntroStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Receive residence permit card</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-gray-800 mb-4">
            The last step to your Swiss residence permit.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => setPermitWorkflowStep('info')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderPermitInfoStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Receive residence permit card</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <div className="space-y-4 text-gray-800">
            <p>After you register at your Gemeinde, your data goes to the cantonal migration office.</p>
            
            <p>You'll receive a letter which requires a signature upon receipt. Missing the delivery means you'll have to pick it up at the post office. The letter will provide an appointment to collect biometric data (fingerprints + photo). Appointments are given usually within the first 1–2 weeks after registration.</p>
            
            <p>After biometrics, the permit card (plastic ID card) is produced by the federal authorities and sent to your Swiss address by registered post.</p>
            
            <p>Processing can take 2–8 weeks depending on canton.</p>
            
            <p>Children also receive a card and are required to provide data at the appointment (no fingerprints for younger kids).</p>
            
            <p>This card is needed for many admin tasks (opening bank account, long-term housing, some insurances, travel).</p>
            
            <p><strong>Fees:</strong> usually around CHF 60 - 150 per adult, depending on the canton and permit type</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setPermitWorkflowStep('question')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderPermitQuestionStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Receive residence permit card</h2>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Have you received your permit card yet?</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                // Mark task as completed
                markTaskAsCompleted('receive_permit_card');
                setPermitWorkflowStep('completed');
              }}
              className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
            >
              Yes
            </button>
            
            <button
              onClick={() => setPermitWorkflowStep('time-check')}
              className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
            >
              Not yet
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPermitTimeCheckStep = () => {
    const targetCanton = currentUser?.target_canton || 'Zurich';
    const cantonName = getCountryName(targetCanton);
    
    return (
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-gray-800 mb-4">
            If you haven't received your biometric appointment letter 3 weeks after registration, consider contacting your cantonal migration office.
          </p>
          
          <div className="text-center">
            <button
              onClick={() => setPermitWorkflowStep('email-generator')}
              className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
            >
              Generate mail
            </button>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-gray-800">
            <strong>Tip:</strong> Keep the biometric appointment letter safe: you'll need it for the appointment.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => setPermitWorkflowStep('reminder')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Set Reminder
          </button>
        </div>
      </div>
    );
  };

  const renderPermitEmailGeneratorStep = () => {
    const targetCanton = currentUser?.target_canton;
    const language = targetCanton?.toLowerCase().includes('zurich') || targetCanton?.toLowerCase().includes('bern') ? 'German' : 'French';
    
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Receive residence permit card</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          
          <div className="bg-white border border-gray-200 rounded-md p-4 text-sm">
            <p className="text-gray-700 mb-2"><strong>To:</strong> migration@[your-canton].ch</p>
            <p className="text-gray-700 mb-2"><strong>Subject:</strong> Inquiry about Biometric Appointment Letter</p>
            <div className="text-gray-700">
              <p className="mb-2">Dear Migration Office,</p>
              <p className="mb-2">I registered at my municipality more than 3 weeks ago and have not yet received my biometric appointment letter.</p>
              <p className="mb-2">Could you please provide me with information about:</p>
              <ul className="list-disc list-inside ml-4 mb-2">
                <li>The status of my application</li>
                <li>When I can expect to receive the appointment letter</li>
                <li>If there are any additional documents required</li>
              </ul>
              <p className="mb-2">Thank you for your assistance.</p>
              <p>Best regards,<br/>{currentUser?.first_name} {currentUser?.last_name}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              navigator.clipboard.writeText(document.querySelector('.bg-white.border')?.textContent || '');
              alert('Email copied to clipboard!');
            }}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Copy Email to Clipboard
          </button>
        </div>
      </div>
    );
  };

  const renderPermitReminderStep = () => {
    return (
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <p className="text-gray-800 mb-4">
            Shall we remind you in 7 days to check on your card status?
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              // Mark task as completed
              markTaskAsCompleted('receive_permit_card');
              setPermitWorkflowStep('completed');
            }}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
          >
            Set Reminder
          </button>
        </div>
      </div>
    );
  };

  const renderPermitCompletedStep = () => {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-800">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Completed!</h2>
          <p className="text-gray-600">Permit card process completed successfully.</p>
        </div>
        
        <button
          onClick={() => router.push('/')}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 text-lg font-medium"
        >
          Home
        </button>
      </div>
    );
  };

  /* 
   * ============================================================================
   * MAIN WORKFLOW ROUTER
   * ============================================================================
   * Central dispatcher that routes to appropriate task-specific workflows
   */
  const renderWorkflowContent = () => {
    if (task?.id === 'secure_visa') {
      // Task 1: Visa/Permit workflow
      switch (workflowStep) {
        case 'intro':
          return renderIntroStep();

        case 'info':
          return renderInfoStep();

        case 'question':
          return renderQuestionStep();

        case 'reminder':
          return renderReminderStep();

        case 'completed':
          return renderCompletedStep();

        default:
          return renderStandardContent();
      }
    } else if (task?.id === 'find_housing') {
      // Task 2: Housing search with real-time data
      switch (workflowStep) {
        case 'intro':
          return renderHousingIntroStep();

        case 'info':
          return renderHousingInfoStep();

        case 'question':
          return renderHousingQuestionStep();

        case 'search':
          return renderHousingSearchStep();

        case 'toppicks':
          return renderHousingTopPicksStep();

        case 'application':
          return renderHousingApplicationStep();

        case 'completed':
          return renderHousingCompletedStep();

        default:
          return renderStandardContent();
      }
    } else if (task?.id === 'register_gemeinde') {
      // Task 3: Gemeinde registration (14-day deadline)
      switch (gemeindeWorkflowStep) {
        case 'intro':
          return renderGemeindeIntroStep();

        case 'info':
          return renderGemeindeInfoStep();

        case 'question':
          return renderGemeindeQuestionStep();

        case 'opening-hours':
          return renderGemeindeOpeningHoursStep();

        case 'email':
          return renderGemeindeEmailStep();

        case 'reminder':
          return renderGemeindeReminderStep();

        case 'completed':
          return renderGemeindeCompletedStep();

        default:
          return renderGemeindeIntroStep();
      }
    } else if (task?.id === 'register_school') {
      // Task 4: School registration (family-dependent)
      switch (schoolWorkflowStep) {
        case 'intro':
          return renderSchoolIntroStep();
        case 'question':
          return renderSchoolQuestionStep();
        case 'research':
          return renderSchoolResearchStep();
        case 'pdf-form':
          return renderSchoolPdfFormStep();
        case 'online-portal':
          return renderSchoolOnlinePortalStep();
        case 'fallback-email':
          return renderSchoolFallbackEmailStep();
        case 'reminder':
          return renderSchoolReminderStep();
        case 'completed':
          return renderSchoolCompletedStep();
        default:
          return renderSchoolIntroStep();
      }
    } else if (task?.id === 'receive_permit_card') {
      // Task 5: Final permit card collection
      switch (permitWorkflowStep) {
        case 'intro':
          return renderPermitIntroStep();
        case 'info':
          return renderPermitInfoStep();
        case 'question':
          return renderPermitQuestionStep();
        case 'time-check':
          return renderPermitTimeCheckStep();
        case 'email-generator':
          return renderPermitEmailGeneratorStep();
        case 'reminder':
          return renderPermitReminderStep();
        case 'completed':
          return renderPermitCompletedStep();
        default:
          return renderPermitIntroStep();
      }
    } else {
      // For other tasks, show the standard content
      return renderStandardContent();
    }
  };

  const renderIntroStep = () => {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Make sure your legal right to stay in Switzerland is secured
        </h2>
        
        <button
          onClick={handleNextStep}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300"
        >
          Continue
        </button>
      </div>
    );
  };

  const renderInfoStep = () => {
    const hasCountry = currentUser?.country_of_origin;
    const requiresVisa = hasCountry ? isVisaRequired(currentUser.country_of_origin) : null;
    const isVisaExempt = hasCountry && !requiresVisa;

    return (
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          {!hasCountry ? (
            <div>
              <p className="text-gray-700 mb-2">
                You haven't shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic.
              </p>
              <p className="text-gray-700">
                Would you like to <button 
                  onClick={() => window.location.href = '/profile/settings'}
                  className="text-gray-800 underline hover:text-gray-800"
                >
                  complete your profile
                </button>, so you get the most out of your experience on Village?
              </p>
            </div>
          ) : isVisaExempt ? (
            <div>
              <p className="text-gray-700 mb-2">
                Since you are a citizen of {getCountryName(currentUser.country_of_origin)}:
              </p>
              <ul className="text-gray-700 space-y-1 list-disc list-inside">
                <li>You may enter Switzerland without a visa and stay up to 90 days as a tourist.</li>
                <li>To live and work here, you need one of the following residence/work permits: L (short-term) or B (longer-term).</li>
                <li>Your Swiss employer must apply for this permit before you start work.</li>
                <li>Once approved, you can enter Switzerland visa-free and must register at your Gemeinde (municipality) within 14 days (see task Register at your Gemeinde (municipality)).</li>
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-2">
                Since you are a citizen of {getCountryName(currentUser.country_of_origin)}:
              </p>
              <ul className="text-gray-700 space-y-1 list-disc list-inside">
                <li>Non-EU/EFTA citizens require a permit to live and work in Switzerland.</li>
                <li>Your Swiss employer must apply for a work permit on your behalf with the cantonal authorities.</li>
                <li>After your permit is approved by the canton and confirmed by the federal authorities (SEM), the Swiss embassy/consulate in your home country will issue you a D visa, which allows you to enter Switzerland to take up residence and employment.</li>
                <li>After arrival, you must register at your Gemeinde (municipality) within 14 days and you will then receive your permit card: L (short-term) or B (longer-term) (see task Register at your Gemeinde (municipality)).</li>
              </ul>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={handleNextStep}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderQuestionStep = () => {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Do you already have a work visa / permit for Switzerland?
        </h2>

        <div className="space-y-4">
          <button
            onClick={() => handlePermitResponse(true)}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300"
          >
            Yes
          </button>
          <button
            onClick={() => handlePermitResponse(false)}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300"
          >
            Not yet
          </button>
        </div>
      </div>
    );
  };

  const renderReminderStep = () => {
    const hasCountry = currentUser?.country_of_origin;
    const requiresVisa = hasCountry ? isVisaRequired(currentUser.country_of_origin) : null;

    const handleReminderSelection = () => {
      // Don't mark as completed - this is a recurring process
      // Just redirect back to dashboard
      router.push('/');
    };

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
        
        {!hasCountry ? (
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Please <button 
                onClick={() => window.location.href = '/profile/settings'}
                className="text-gray-800 underline hover:text-gray-800"
              >
                update your profile
              </button> with your country of origin so we can give you the exact next steps.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">
                Check the status of your permit application with your Swiss employer. You cannot start work until it's approved.
                {requiresVisa && " Once it's approved by the authorities, you must contact the Swiss embassy/consulate in your home country to obtain a D visa before traveling."}
              </p>
            </div>
          </div>
        )}

        {/* Reminder Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Shall we remind you to check on the status 3/7/14 days from now?</h3>
          <div className="flex space-x-3 justify-center">
            <button 
              onClick={handleReminderSelection}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              3 days
            </button>
            <button 
              onClick={handleReminderSelection}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              7 days
            </button>
            <button 
              onClick={handleReminderSelection}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              14 days
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCompletedStep = () => {
    // Mark task as completed in localStorage (only when user has permit)
    const markTaskAsCompletedLocal = () => {
      markTaskAsCompleted(task.id);
    };

    // Auto-complete task when user confirms they have permit
    useEffect(() => {
      if (hasWorkPermit === true) {
        markTaskAsCompletedLocal();
      }
    }, [hasWorkPermit, task.id]); // Added task.id to dependency array for completeness

    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Completed!</h2>
          <p className="text-gray-600">
            You already have a work permit for Switzerland.
          </p>
        </div>
        <button
          onClick={handleBackClick}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Home
        </button>
      </div>
    );
  };

  // Housing Task Workflow Functions
  const renderHousingIntroStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Intro</h2>
        <p className="text-gray-700 mb-6">
          The first step to building a home is finding a place that fits your needs.
        </p>
        
        <button
          onClick={handleNextStep}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300"
        >
          Continue
        </button>
      </div>
    );
  };

  const renderHousingInfoStep = () => {
    return (
      <div>
        <div className="space-y-4 mb-6">
          <p className="text-gray-700">
            ~60% of Swiss residents rent; competition is high in big cities (Zurich, Geneva, Basel, Zug).
          </p>
          
          <p className="text-gray-700">
            Research the specific "Gemeinde" (municipality) you are considering. Taxes, public transport, and local amenities can vary significantly even between adjacent municipalities.
          </p>
          
          <p className="text-gray-700">
            Room count: 2.5 rooms = 1 bedroom + 1 living room; ".5" stands for the open dining room or a small room. Kitchen and bathrooms are not counted.
          </p>
          
          <p className="text-gray-700">
            Deposit: typically 1–3 months' rent in a blocked account (or insurance product).
          </p>
          
          <p className="text-gray-700">
            Application dossier: property owners expect a polished bundle (photo of passport/ID, copy of your Swiss residence permit (L or B) or visa approval letter, references, motivational letter; for locals a "Betreibungsauszug" (debt enforcement extract); for newcomers an employer letter + clean credit report, references from former rental agencies and your employer.
          </p>
          
          <p className="text-gray-700">
            Extras: utilities (Nebenkosten) may be included as a flat fee or billed quarterly or annually; electricity costs are usually payed directly by the renter; parking is separate; almost every flat has a cellar (Keller) storage; shared laundry rooms can have fixed schedules.
          </p>
          
          <p className="text-gray-700">
            Pets & furnished flats: often restricted; check explicitly.
          </p>
          
          <p className="text-gray-700">
            Beware of scams! Never pay for a viewing or transfer deposits to private accounts.
          </p>
        </div>
        
        <button
          onClick={handleNextStep}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300"
        >
          Continue
        </button>
      </div>
    );
  };

  const renderHousingQuestionStep = () => {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Have you already found a permanent residency?
        </h2>

        <div className="space-y-4">
          <button
            onClick={() => {
              // Mark housing task as completed
              markTaskAsCompleted(task.id);
              setWorkflowStep('completed');
            }}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300"
          >
            Yes
          </button>
          <button
            onClick={() => setWorkflowStep('search')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300"
          >
            Not yet
          </button>
        </div>
      </div>
    );
  };

  const renderHousingSearchStep = () => {
    const rentEstimation = calculateRentEstimation();

    const handleFormChange = (field: string, value: any) => {
      setHousingForm(prev => ({
        ...prev,
        [field]: value
      }));
    };

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What are you looking for? (Form to fill out)</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary or permanent</label>
              <select 
                value={housingForm.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select</option>
                <option value="temporary">Temporary</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget range (CHF/month)</label>
              <input 
                type="number" 
                value={housingForm.budget}
                onChange={(e) => handleFormChange('budget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                placeholder="e.g. 2000" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size (rooms)</label>
              <input 
                type="number" 
                step="0.5" 
                value={housingForm.size}
                onChange={(e) => handleFormChange('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                placeholder="e.g. 2.5" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location with radius</label>
              <input 
                type="text" 
                value={housingForm.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                placeholder="e.g. Zurich, 10km" 
              />
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="wheelchair" 
                checked={housingForm.wheelchair}
                onChange={(e) => handleFormChange('wheelchair', e.target.checked)}
                className="mr-2" 
              />
              <label htmlFor="wheelchair" className="text-sm font-medium text-gray-700">Wheelchair-friendly</label>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="parking" 
                checked={housingForm.parking}
                onChange={(e) => handleFormChange('parking', e.target.checked)}
                className="mr-2" 
              />
              <label htmlFor="parking" className="text-sm font-medium text-gray-700">Parking</label>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="pets" 
                checked={housingForm.pets}
                onChange={(e) => handleFormChange('pets', e.target.checked)}
                className="mr-2" 
              />
              <label htmlFor="pets" className="text-sm font-medium text-gray-700">Pets allowed</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              <input 
                type="date" 
                value={housingForm.availability}
                onChange={(e) => handleFormChange('availability', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          {rentEstimation ? (
            <div>
              {rentEstimation.isGoodFit ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-800 font-medium">Good fit</p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-800 font-medium">Tight market</p>
                </div>
              )}
              
            </div>
          ) : (
            <p className="text-gray-600 text-sm">
              Fill out the form above to see your personalized rent estimation.
            </p>
          )}
        </div>


        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Hot Tips</h3>
          <div className="space-y-3">
            <p className="text-gray-700">
              Sign up to Immomailing for CHF 49.- to receive a daily newsletter & early access to new items on the market. [sign up integrated so we can count how many we send]
            </p>
            <p className="text-gray-700">
              Use Social media as some listings never hit the big portals. E.g. Join Facebook groups specific to apartment listings in your city such as "Zürich: WG, Wohnung, Zimmer, Apartment, Nachmieter, mieten, vermieten"
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Didn't find what you were looking for?</h3>
          <p className="text-gray-700 mb-3">Set up an alert for popular sites:</p>
          <div className="space-y-2">
            <a 
              href="https://www.homegate.ch/c/en/about-us/newsletter-subscription" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded text-center hover:bg-gray-300 transition-colors"
            >
              Homegate.ch Newsletter
            </a>
            <a 
              href="https://www.immoscout24.ch/c/en/about-us/newsletter-subscription" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded text-center hover:bg-gray-300 transition-colors"
            >
              Immoscout24.ch Newsletter
            </a>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setWorkflowStep('question')}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Check again: Have you found housing?
          </button>
        </div>
      </div>
    );
  };

  const renderHousingTopPicksStep = () => {
    const topPicks = getTopPicks();

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's top-picks</h2>
        
        {!isScraping && scrapedPicks.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-gray-800 mb-3">Get real-time housing data from Swiss portals:</p>
            <button 
              onClick={scrapeRealHousingData}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              🔍 Scrape Real Housing Data
            </button>
          </div>
        )}

        {isScraping && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-3"></div>
              <p className="text-gray-800">Scraping real housing data from Swiss portals...</p>
            </div>
          </div>
        )}

        {scrapedPicks.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-gray-800">✅ Found {scrapedPicks.length} real listings from Swiss portals!</p>
          </div>
        )}
        
        {topPicks.length > 0 ? (
          <div className="space-y-4 mb-6">
            {topPicks.map((pick) => (
              <a 
                key={pick.id} 
                href={pick.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{pick.title}</h3>
                    <p className="text-lg font-bold text-gray-800">CHF {pick.price.toLocaleString()}/month</p>
                    <p className="text-sm text-gray-600">{pick.size} • {pick.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      {pick.matchScore}% match
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{pick.availability}</p>
                    {pick.portal && (
                      <p className="text-xs text-gray-800 mt-1 font-medium">
                        via {pick.portal.charAt(0).toUpperCase() + pick.portal.slice(1)}
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm mb-3">{pick.description}</p>
                
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {pick.features.map((feature, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">Please fill out the search form first to see personalized top picks.</p>
            <button 
              onClick={() => setWorkflowStep('search')}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Back to Search Form
            </button>
          </div>
        )}
        
        <div className="text-center space-y-3">
          <button
            onClick={() => setWorkflowStep('search')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Back to Search
          </button>
          <button
            onClick={() => setWorkflowStep('question')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Check: Have you found housing?
          </button>
        </div>
      </div>
    );
  };

  const renderHousingApplicationStep = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ready to apply?</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Upload the following documents (you only have to do this once & we'll auto-attach your bundle for every application)</h3>
          <div className="space-y-2">
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded text-left hover:bg-gray-300">
              📄 "Betreibungsauszug" if you've resided in Switzerland for a few months already or alternatively a credit report
            </button>
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded text-left hover:bg-gray-300">
              📄 Picture of your passport/ID
            </button>
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded text-left hover:bg-gray-300">
              📄 Copy of your Swiss residence permit (L or B) or visa approval letter
            </button>
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded text-left hover:bg-gray-300">
              📄 Employment verification letter
            </button>
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded text-left hover:bg-gray-300">
              📄 Contact details of your employer and a former property owner as references
            </button>
            <button className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded text-left hover:bg-gray-300">
              📄 Add other documents [Option to add any other documents to application bundle]
            </button>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Generate the motivational letter in the language of the listing</h3>
          <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
            Generate Letter
          </button>
        </div>

        <div className="text-center space-y-3">
          <button
            onClick={() => setWorkflowStep('search')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Continue searching
          </button>
          <button
            onClick={() => setWorkflowStep('question')}
            className="w-full max-w-xs bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Check: Have you found housing?
          </button>
        </div>
      </div>
    );
  };

  const renderHousingCompletedStep = () => {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Completed!</h2>
          <p className="text-gray-600">
            You have found permanent housing.
          </p>
        </div>
        <button
          onClick={handleBackClick}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Home
        </button>
      </div>
    );
  };


  const renderStandardContent = () => {
    return (
      <>
        {/* Task Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">{task.content.intro}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Priority</h3>
              <p className="text-sm text-blue-700 capitalize">{task.priority}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Estimated Time</h3>
              <p className="text-sm text-green-700">{task.content.estimatedTime}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900">Category</h3>
              <p className="text-sm text-purple-700 capitalize">{task.category}</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Steps to Complete</h2>
          <ol className="list-decimal list-inside space-y-2">
            {task.content.steps.map((step: string, index: number) => (
              <li key={index} className="text-gray-700">{step}</li>
            ))}
          </ol>
        </div>

        {/* Requirements */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Documents</h2>
          <ul className="list-disc list-inside space-y-2">
            {task.content.requirements.map((requirement: string, index: number) => (
              <li key={index} className="text-gray-700">{requirement}</li>
            ))}
          </ul>
        </div>

        {/* Important Notes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Notes</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <ul className="list-disc list-inside space-y-2">
              {task.content.importantNotes.map((note: string, index: number) => (
                <li key={index} className="text-gray-800">{note}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300">
            Mark as Started
          </button>
          <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300">
            Mark as Completed
          </button>
        </div>
      </>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view task details.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Task not found.</p>
          <button 
            onClick={handleBackClick}
            className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <p className="text-sm text-gray-600">Task Details</p>
            </div>
            <button
              onClick={handleBackClick}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {renderWorkflowContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
