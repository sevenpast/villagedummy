// Mock data for tasks - simulating what would come from Supabase
export interface Task {
  task_id: string;
  basic_info: {
    title: string;
    category: string;
    estimated_duration: string;
  };
  sequencing_info: {
    priority: number;
    depends_on: string[];
    unlocks: string[];
  };
}

export interface TaskContent {
  content_structure: {
    title: string;
    intro: string;
    info_box: string;
    action_options: {
      primary: string;
      secondary: string;
    };
  };
}

export interface TaskStatus {
  status: 'pending' | 'in_progress' | 'completed';
  current_step: number;
  metadata: any;
}

// Mock user profile
export const mockUserProfile = {
  id: 'user-123',
  citizenship_info: {
    is_eu_efta: false,
    country_of_origin: 'United States',
    visa_status: 'visa_required'
  },
  family_unit: [
    {
      relationship: 'spouse',
      personal_info: {
        dob: '1985-06-15'
      }
    },
    {
      relationship: 'child',
      personal_info: {
        dob: '2015-03-20'
      }
    }
  ],
  residence_info: {
    municipality: 'Zurich'
  },
  profile_completeness: {
    has_country: true,
    has_family_status: true
  }
};

// Mock tasks data
export const mockTasks: Task[] = [
  {
    task_id: 'secure_visa',
    basic_info: {
      title: 'Secure residence permit / visa',
      category: 'legal',
      estimated_duration: '2-8 weeks'
    },
    sequencing_info: {
      priority: 1,
      depends_on: [],
      unlocks: ['register_gemeinde']
    }
  },
  {
    task_id: 'find_housing',
    basic_info: {
      title: 'Find housing',
      category: 'essential',
      estimated_duration: '2-6 weeks'
    },
    sequencing_info: {
      priority: 2,
      depends_on: [],
      unlocks: ['register_gemeinde']
    }
  },
  {
    task_id: 'register_gemeinde',
    basic_info: {
      title: 'Register at Gemeinde (municipality)',
      category: 'legal',
      estimated_duration: '1 day'
    },
    sequencing_info: {
      priority: 3,
      depends_on: ['secure_visa'],
      unlocks: ['receive_permit_card']
    }
  },
  {
    task_id: 'register_school',
    basic_info: {
      title: 'Register children for school',
      category: 'family',
      estimated_duration: '1-2 weeks'
    },
    sequencing_info: {
      priority: 4,
      depends_on: ['register_gemeinde'],
      unlocks: []
    }
  },
  {
    task_id: 'receive_permit_card',
    basic_info: {
      title: 'Receive permit card',
      category: 'legal',
      estimated_duration: '2-4 weeks'
    },
    sequencing_info: {
      priority: 5,
      depends_on: ['register_gemeinde'],
      unlocks: []
    }
  }
];

// Mock task content based on user profile
export const getMockTaskContent = (taskId: string): TaskContent => {
  const user = mockUserProfile;
  
  switch (taskId) {
    case 'secure_visa':
      return {
        content_structure: {
          title: 'Secure residence permit / visa',
          intro: 'Since you are a citizen of United States, you need to secure a work permit before entering Switzerland.',
          info_box: `As a citizen of United States, you need to:

1. Your employer must apply for a work permit on your behalf
2. The application is processed by the cantonal authorities
3. Once approved, you'll receive a D visa to enter Switzerland
4. The process typically takes 2-8 weeks

Required documents:
- Employment contract
- Educational certificates
- Passport
- Health insurance proof
- Criminal background check`,
          action_options: {
            primary: 'Mark as Completed',
            secondary: 'Need Help with Process'
          }
        }
      };

    case 'find_housing':
      return {
        content_structure: {
          title: 'Find housing',
          intro: 'Secure accommodation before or shortly after arrival in Switzerland.',
          info_box: `Finding housing in Switzerland can be competitive, especially in major cities like Zurich.

Tips for finding housing:
- Start your search early (2-3 months before arrival)
- Use multiple platforms: Homegate.ch, ImmoScout24.ch, RonOrp.ch
- Prepare all required documents in advance
- Consider temporary housing first
- Be ready to pay 2-3 months rent as deposit

Required documents:
- Employment contract
- Salary certificate
- Passport/ID
- Previous rental references`,
          action_options: {
            primary: 'Mark as Completed',
            secondary: 'Search Housing Now'
          }
        }
      };

    case 'register_gemeinde':
      return {
        content_structure: {
          title: 'Register at your Gemeinde (municipality)',
          intro: 'Make your residence official within 14 days of arrival',
          info_box: `Since you are a citizen of United States:

After your employer's application is approved and the Swiss embassy issues your D visa, you may enter Switzerland.

Within 14 days of arrival, you must register at your Gemeinde (municipality).
You will then receive your L (short-term) or B (longer-term) permit card.

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Documents usually required at the Gemeinde:
- Passport/ID for each family member
- For families: documents on marital status
- Employment contract (with length and hours)
- Rental contract or landlord confirmation  
- Visa approval letter
- Passport photos (sometimes required)
- Proof of health insurance (or provide it within 3 months)`,
          action_options: {
            primary: 'Mark as Completed',
            secondary: 'Get Municipality Info'
          }
        }
      };

    case 'register_school':
      return {
        content_structure: {
          title: 'Register children for school',
          intro: 'Enroll your child in the Swiss school system',
          info_box: `Since you have a school-age child (born 2015-03-20), you need to register them for school.

In Switzerland, education is compulsory from age 4-16. Your child will likely attend:
- Kindergarten (age 4-6)
- Primary school (age 6-12)
- Secondary school (age 12-16)

Registration process:
1. Contact your local school district
2. Provide proof of residence registration
3. Submit child's birth certificate and vaccination records
4. Complete enrollment forms
5. Attend orientation meeting

The school year typically starts in August.`,
          action_options: {
            primary: 'Mark as Completed',
            secondary: 'Contact School District'
          }
        }
      };

    case 'receive_permit_card':
      return {
        content_structure: {
          title: 'Receive permit card',
          intro: 'Wait for your residence permit card to arrive',
          info_box: `After registering at your Gemeinde, you will receive your residence permit card (L or B permit) within 2-4 weeks.

This card is your official proof of residence in Switzerland and is required for:
- Opening a bank account
- Getting health insurance
- Employment verification
- Travel within the Schengen area

The card will be sent to your registered address. Make sure your address is correct at the Gemeinde.`,
          action_options: {
            primary: 'Yes - Mark as Done',
            secondary: 'Not yet - Check Status'
          }
        }
      };

    default:
      return {
        content_structure: {
          title: 'Unknown Task',
          intro: 'This task is not recognized.',
          info_box: 'Please contact support for assistance.',
          action_options: {
            primary: 'Mark as Completed',
            secondary: 'Get Help'
          }
        }
      };
  }
};

// Mock task statuses
export const mockTaskStatuses: Record<string, TaskStatus> = {
  'secure_visa': {
    status: 'completed',
    current_step: 1,
    metadata: { completed_date: '2024-09-15' }
  },
  'find_housing': {
    status: 'in_progress',
    current_step: 2,
    metadata: { started_date: '2024-09-20' }
  },
  'register_gemeinde': {
    status: 'pending',
    current_step: 1,
    metadata: {}
  },
  'register_school': {
    status: 'pending',
    current_step: 1,
    metadata: {}
  },
  'receive_permit_card': {
    status: 'pending',
    current_step: 1,
    metadata: {}
  }
};
