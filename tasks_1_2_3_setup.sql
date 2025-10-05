-- ============================================
-- TASKS 1-3: COMPLETE SETUP
-- Based on the documentation and architecture
-- ============================================

-- First, ensure we have the module
INSERT INTO modules (id, title, description, display_order, is_active)
VALUES (1, 'Welcome to Switzerland', 'Essential tasks for new residents', 1, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TASK 1: SECURE RESIDENCE PERMIT / VISA
-- ============================================

INSERT INTO tasks (id, task_number, module_id, title, category, priority, deadline_days, is_urgent, icon_name)
VALUES (
  1,
  1,
  1,
  'Secure residence permit / visa',
  'legal',
  100,
  NULL,
  false,
  'passport'
) ON CONFLICT (id) DO NOTHING;

-- Task 1 Variants for different audiences
INSERT INTO task_variants (
  task_id,
  target_audience,
  intro,
  info_box,
  initial_question,
  answer_options,
  actions,
  ui_config,
  priority
) VALUES 
-- EU/EFTA Citizens
(
  1,
  '["EU/EFTA"]',
  'Get your residence permit to work legally in Switzerland',
  'As an EU/EFTA citizen, you have the right to live and work in Switzerland, but you still need to register and get a residence permit.

**What you need:**
- Valid passport or ID card
- Employment contract or job offer
- Proof of health insurance
- Proof of accommodation

**Timeline:** Apply within 14 days of arrival
**Cost:** Usually free for EU/EFTA citizens
**Validity:** 5 years (can be renewed)',
  'Do you already have a residence permit or visa?',
  '["Yes, I have it", "No, I need to apply", "I''m not sure"]',
  '{
    "Yes, I have it": {
      "action": "mark_complete",
      "message": "Great! You''re all set to work legally in Switzerland."
    },
    "No, I need to apply": {
      "action": "show_guidance",
      "message": "Let''s help you with the application process.",
      "next_step": "application_guidance"
    },
    "I''m not sure": {
      "action": "show_checklist",
      "message": "Let''s check what documents you have."
    }
  }',
  '{
    "components": [
      {
        "type": "question_multiple",
        "question": "Do you already have a residence permit or visa?",
        "options": [
          {
            "value": "yes",
            "label": "Yes, I have it",
            "description": "I already have my residence permit"
          },
          {
            "value": "no",
            "label": "No, I need to apply",
            "description": "I need to start the application process"
          },
          {
            "value": "not_sure",
            "label": "I''m not sure",
            "description": "Help me figure out what I need"
          }
        ],
        "actions": {
          "yes": {
            "action": "mark_complete",
            "message": "Great! You''re all set to work legally in Switzerland. ✅"
          },
          "no": {
            "action": "show_followup",
            "next": "application_guidance"
          },
          "not_sure": {
            "action": "show_followup",
            "next": "document_checklist"
          }
        }
      },
      {
        "type": "conditional",
        "showIf": "no",
        "id": "application_guidance",
        "components": [
          {
            "type": "text",
            "content": "📋 **Application Process for EU/EFTA Citizens:**",
            "style": "header"
          },
          {
            "type": "checklist",
            "title": "Required Documents:",
            "items": [
              "Valid passport or national ID card",
              "Employment contract or job offer letter",
              "Proof of health insurance coverage",
              "Proof of accommodation (rental contract or hotel booking)",
              "Passport photos (2 recent photos)",
              "Application form (available at Gemeinde)"
            ]
          },
          {
            "type": "comparison_table",
            "title": "Where to Apply:",
            "headers": ["Location", "When", "Cost", "Processing Time"],
            "rows": [
              ["Your local Gemeinde (municipality)", "Within 14 days of arrival", "Usually free", "2-4 weeks"],
              ["Cantonal Migration Office", "If Gemeinde refers you", "CHF 0-50", "4-8 weeks"],
              ["Swiss Embassy (if abroad)", "Before arrival", "CHF 0-100", "2-6 weeks"]
            ]
          },
          {
            "type": "ai_generate",
            "buttonText": "Generate Application Checklist",
            "aiType": "personalized_checklist",
            "prompt": "Create a personalized residence permit application checklist for EU/EFTA citizen in {user.municipality}"
          }
        ]
      },
      {
        "type": "conditional",
        "showIf": "not_sure",
        "id": "document_checklist",
        "components": [
          {
            "type": "text",
            "content": "🔍 **Let''s check what you have:**",
            "style": "header"
          },
          {
            "type": "checklist",
            "title": "Do you have these documents?",
            "items": [
              "Valid passport or national ID card",
              "Employment contract or job offer",
              "Health insurance proof",
              "Accommodation proof"
            ]
          },
          {
            "type": "question_yesno",
            "question": "Do you have all the required documents?",
            "actions": {
              "yes": {
                "action": "show_followup",
                "next": "application_guidance"
              },
              "no": {
                "action": "show_alert",
                "severity": "info",
                "message": "📝 You''ll need to gather the missing documents first. Contact your employer or HR department for help."
              }
            }
          }
        ]
      }
    ]
  }',
  100
),

-- Non-EU Citizens
(
  1,
  '["Non-EU/EFTA"]',
  'Secure your work visa and residence permit',
  'Non-EU/EFTA citizens need both a work visa (from Swiss embassy) and a residence permit.

**Important:** You CANNOT start working until you have both documents!

**Process:**
1. Get job offer from Swiss employer
2. Employer applies for work permit at cantonal office
3. You apply for visa at Swiss embassy in your home country
4. Enter Switzerland with visa
5. Apply for residence permit at local Gemeinde

**Timeline:** 2-6 months total
**Cost:** CHF 100-500 depending on country',
  'What stage are you at in the visa/permit process?',
  '["I have both visa and permit", "I have visa, need permit", "I need visa", "I''m still looking for a job"]',
  '{
    "I have both visa and permit": {
      "action": "mark_complete",
      "message": "Excellent! You''re fully authorized to work in Switzerland."
    },
    "I have visa, need permit": {
      "action": "show_guidance",
      "message": "You''re almost there! Let''s get your residence permit.",
      "next_step": "permit_application"
    },
    "I need visa": {
      "action": "show_guidance",
      "message": "You need to apply for a visa first.",
      "next_step": "visa_application"
    },
    "I''m still looking for a job": {
      "action": "show_guidance",
      "message": "You need a job offer first before applying for visa.",
      "next_step": "job_search_guidance"
    }
  }',
  '{
    "components": [
      {
        "type": "question_multiple",
        "question": "What stage are you at in the visa/permit process?",
        "options": [
          {
            "value": "both",
            "label": "I have both visa and permit",
            "description": "Fully authorized to work"
          },
          {
            "value": "visa_only",
            "label": "I have visa, need permit",
            "description": "Need to apply for residence permit"
          },
          {
            "value": "need_visa",
            "label": "I need visa",
            "description": "Need to apply for work visa"
          },
          {
            "value": "no_job",
            "label": "I''m still looking for a job",
            "description": "Need job offer first"
          }
        ],
        "actions": {
          "both": {
            "action": "mark_complete",
            "message": "Excellent! You''re fully authorized to work in Switzerland. ✅"
          },
          "visa_only": {
            "action": "show_followup",
            "next": "permit_application"
          },
          "need_visa": {
            "action": "show_followup",
            "next": "visa_application"
          },
          "no_job": {
            "action": "show_followup",
            "next": "job_search_guidance"
          }
        }
      },
      {
        "type": "conditional",
        "showIf": "visa_only",
        "id": "permit_application",
        "components": [
          {
            "type": "text",
            "content": "🏠 **Residence Permit Application:**",
            "style": "header"
          },
          {
            "type": "checklist",
            "title": "Required for residence permit:",
            "items": [
              "Valid work visa (entry visa)",
              "Employment contract",
              "Health insurance proof",
              "Accommodation proof",
              "Passport photos",
              "Application form"
            ]
          },
          {
            "type": "text",
            "content": "📍 **Where to apply:** Your local Gemeinde (municipality office)",
            "style": "info"
          }
        ]
      },
      {
        "type": "conditional",
        "showIf": "need_visa",
        "id": "visa_application",
        "components": [
          {
            "type": "text",
            "content": "🛂 **Work Visa Application:**",
            "style": "header"
          },
          {
            "type": "text",
            "content": "⚠️ **Important:** Your employer must apply for your work permit first!",
            "style": "warning"
          },
          {
            "type": "checklist",
            "title": "Steps for visa application:",
            "items": [
              "Employer applies for work permit at cantonal office",
              "Wait for work permit approval (2-8 weeks)",
              "Apply for visa at Swiss embassy in your home country",
              "Wait for visa approval (2-6 weeks)",
              "Enter Switzerland with visa",
              "Apply for residence permit at Gemeinde"
            ]
          }
        ]
      },
      {
        "type": "conditional",
        "showIf": "no_job",
        "id": "job_search_guidance",
        "components": [
          {
            "type": "text",
            "content": "💼 **Job Search First:**",
            "style": "header"
          },
          {
            "type": "text",
            "content": "You need a job offer from a Swiss employer before you can apply for a work visa.",
            "style": "info"
          },
          {
            "type": "external_link",
            "text": "Search Jobs on jobs.ch",
            "url": "https://www.jobs.ch"
          },
          {
            "type": "external_link",
            "text": "Search Jobs on Indeed Switzerland",
            "url": "https://ch.indeed.com"
          }
        ]
      }
    ]
  }',
  95
);

-- ============================================
-- TASK 2: FIND HOUSING
-- ============================================

INSERT INTO tasks (id, task_number, module_id, title, category, priority, deadline_days, is_urgent, icon_name)
VALUES (
  2,
  2,
  1,
  'Find housing',
  'housing',
  90,
  NULL,
  false,
  'home'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO task_variants (
  task_id,
  target_audience,
  intro,
  info_box,
  initial_question,
  answer_options,
  actions,
  ui_config,
  priority
) VALUES (
  2,
  '["all"]',
  'Find your new home in Switzerland',
  'Finding housing in Switzerland can be challenging, especially in popular areas like Zurich, Geneva, and Basel.

**Key Facts:**
- Rental market is competitive
- You''ll need 3 months rent as deposit
- Most apartments are unfurnished
- Contracts are usually for 1 year minimum
- Landlords often require employment contract and references

**Timeline:** Start looking immediately, can take 1-3 months
**Cost:** 3 months rent as deposit + first month rent',
  'Do you already have housing arranged?',
  '["Yes, I have a place", "No, I need to find housing", "I have temporary housing"]',
  '{
    "Yes, I have a place": {
      "action": "mark_complete",
      "message": "Great! Having stable housing is essential for your residence permit."
    },
    "No, I need to find housing": {
      "action": "show_guidance",
      "message": "Let''s help you find the right place.",
      "next_step": "housing_search"
    },
    "I have temporary housing": {
      "action": "show_guidance",
      "message": "Good start! Let''s find you permanent housing.",
      "next_step": "housing_search"
    }
  }',
  '{
    "components": [
      {
        "type": "question_multiple",
        "question": "Do you already have housing arranged?",
        "options": [
          {
            "value": "yes",
            "label": "Yes, I have a place",
            "description": "I have permanent housing arranged"
          },
          {
            "value": "no",
            "label": "No, I need to find housing",
            "description": "I need to start looking for housing"
          },
          {
            "value": "temporary",
            "label": "I have temporary housing",
            "description": "I have short-term housing but need permanent"
          }
        ],
        "actions": {
          "yes": {
            "action": "mark_complete",
            "message": "Great! Having stable housing is essential for your residence permit. ✅"
          },
          "no": {
            "action": "show_followup",
            "next": "housing_search"
          },
          "temporary": {
            "action": "show_followup",
            "next": "housing_search"
          }
        }
      },
      {
        "type": "conditional",
        "showIf": "no",
        "id": "housing_search",
        "components": [
          {
            "type": "text",
            "content": "🏠 **Housing Search Guide:**",
            "style": "header"
          },
          {
            "type": "form",
            "title": "Your Housing Preferences",
            "fields": [
              {
                "name": "budget",
                "label": "Monthly Budget (CHF)",
                "type": "number",
                "required": true,
                "placeholder": "e.g., 2000"
              },
              {
                "name": "rooms",
                "label": "Number of Rooms",
                "type": "select",
                "options": ["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5+"],
                "required": true
              },
              {
                "name": "location",
                "label": "Preferred Location",
                "type": "text",
                "required": true,
                "placeholder": "e.g., Zurich, Geneva, Basel"
              }
            ],
            "submitText": "Find Housing Options",
            "onSubmit": "ai_generate_housing_suggestions"
          },
          {
            "type": "comparison_table",
            "title": "Popular Housing Websites:",
            "headers": ["Website", "Type", "Language", "Best For"],
            "rows": [
              ["homegate.ch", "Rentals & Sales", "DE/FR/IT", "Comprehensive listings"],
              ["immoscout24.ch", "Rentals & Sales", "DE/FR/IT", "Detailed filters"],
              ["ronorp.ch", "Rentals", "DE/FR/IT", "Private landlords"],
              ["wgzimmer.ch", "Shared housing", "DE/FR/IT", "Room shares"],
              ["airbnb.com", "Short-term", "EN", "Temporary housing"]
            ]
          },
          {
            "type": "checklist",
            "title": "Documents you''ll need:",
            "items": [
              "Employment contract",
              "Salary certificate (last 3 months)",
              "Passport/ID copy",
              "Residence permit (if available)",
              "References from previous landlords",
              "Bank statements"
            ]
          },
          {
            "type": "ai_generate",
            "buttonText": "Generate Housing Search Strategy",
            "aiType": "housing_strategy",
            "prompt": "Create a personalized housing search strategy for someone with budget {budget} CHF looking for {rooms} rooms in {location}"
          }
        ]
      },
      {
        "type": "conditional",
        "showIf": "temporary",
        "id": "housing_search",
        "components": [
          {
            "type": "text",
            "content": "🏠 **Upgrade to Permanent Housing:**",
            "style": "header"
          },
          {
            "type": "text",
            "content": "Good that you have temporary housing! Now let''s find you a permanent place.",
            "style": "info"
          },
          {
            "type": "form",
            "title": "Your Housing Preferences",
            "fields": [
              {
                "name": "budget",
                "label": "Monthly Budget (CHF)",
                "type": "number",
                "required": true,
                "placeholder": "e.g., 2000"
              },
              {
                "name": "rooms",
                "label": "Number of Rooms",
                "type": "select",
                "options": ["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5+"],
                "required": true
              },
              {
                "name": "location",
                "label": "Preferred Location",
                "type": "text",
                "required": true,
                "placeholder": "e.g., Zurich, Geneva, Basel"
              }
            ],
            "submitText": "Find Housing Options",
            "onSubmit": "ai_generate_housing_suggestions"
          }
        ]
      }
    ]
  }',
  90
);

-- ============================================
-- TASK 3: REGISTER AT YOUR GEMEINDE (MUNICIPALITY)
-- ============================================

INSERT INTO tasks (id, task_number, module_id, title, category, priority, deadline_days, is_urgent, icon_name)
VALUES (
  3,
  3,
  1,
  'Register at your Gemeinde (municipality)',
  'legal',
  95,
  14,
  true,
  'building'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO task_variants (
  task_id,
  target_audience,
  intro,
  info_box,
  initial_question,
  answer_options,
  actions,
  ui_config,
  priority
) VALUES (
  3,
  '["all"]',
  'Register at your local municipality - MANDATORY within 14 days',
  '⚠️ **URGENT:** You MUST register at your local Gemeinde (municipality) within 14 days of arrival in Switzerland.

**What happens at registration:**
- You get your residence permit card
- You''re officially registered as a resident
- You can open bank accounts, get health insurance, etc.
- You''re assigned to your local tax office

**Required Documents:**
- Passport/ID
- Employment contract
- Rental contract or proof of accommodation
- Health insurance certificate
- Passport photos

**Cost:** Usually CHF 0-50
**Processing time:** 2-4 weeks for permit card',
  'Have you already registered at your Gemeinde?',
  '["Yes, I''m registered", "No, I need to register", "I''m not sure"]',
  '{
    "Yes, I''m registered": {
      "action": "mark_complete",
      "message": "Excellent! You''re officially registered in Switzerland."
    },
    "No, I need to register": {
      "action": "show_guidance",
      "message": "Let''s get you registered immediately - this is urgent!",
      "next_step": "registration_guidance"
    },
    "I''m not sure": {
      "action": "show_guidance",
      "message": "Let''s check if you need to register.",
      "next_step": "registration_check"
    }
  }',
  '{
    "components": [
      {
        "type": "question_multiple",
        "question": "Have you already registered at your Gemeinde?",
        "options": [
          {
            "value": "yes",
            "label": "Yes, I''m registered",
            "description": "I have completed the registration"
          },
          {
            "value": "no",
            "label": "No, I need to register",
            "description": "I need to start the registration process"
          },
          {
            "value": "not_sure",
            "label": "I''m not sure",
            "description": "Help me figure out if I need to register"
          }
        ],
        "actions": {
          "yes": {
            "action": "mark_complete",
            "message": "Excellent! You''re officially registered in Switzerland. ✅"
          },
          "no": {
            "action": "show_followup",
            "next": "registration_guidance"
          },
          "not_sure": {
            "action": "show_followup",
            "next": "registration_check"
          }
        }
      },
      {
        "type": "conditional",
        "showIf": "no",
        "id": "registration_guidance",
        "components": [
          {
            "type": "text",
            "content": "🏛️ **Municipality Registration - URGENT!**",
            "style": "header"
          },
          {
            "type": "text",
            "content": "⚠️ **You have 14 days from arrival to register. Don''t delay!**",
            "style": "warning"
          },
          {
            "type": "checklist",
            "title": "Required Documents:",
            "items": [
              "Valid passport or national ID card",
              "Employment contract or job offer",
              "Rental contract or proof of accommodation",
              "Health insurance certificate",
              "2 recent passport photos (35x45mm)",
              "Completed registration form"
            ]
          },
          {
            "type": "form",
            "title": "Your Municipality Details",
            "fields": [
              {
                "name": "municipality",
                "label": "Municipality Name",
                "type": "text",
                "required": true,
                "placeholder": "e.g., Zurich, Geneva, Basel"
              },
              {
                "name": "canton",
                "label": "Canton",
                "type": "select",
                "options": ["ZH", "BE", "LU", "UR", "SZ", "OW", "NW", "GL", "ZG", "FR", "SO", "BS", "BL", "SH", "AR", "AI", "SG", "GR", "AG", "TG", "TI", "VD", "VS", "NE", "GE", "JU"],
                "required": true
              }
            ],
            "submitText": "Get Municipality Info",
            "onSubmit": "ai_fetch_municipality_requirements"
          },
          {
            "type": "ai_generate",
            "buttonText": "Generate Registration Checklist",
            "aiType": "registration_checklist",
            "prompt": "Create a personalized municipality registration checklist for {municipality}, {canton}"
          },
          {
            "type": "ai_generate",
            "buttonText": "Generate Inquiry Email",
            "aiType": "email_template",
            "prompt": "Write an email to the {municipality} municipality office asking about registration requirements and office hours"
          }
        ]
      },
      {
        "type": "conditional",
        "showIf": "not_sure",
        "id": "registration_check",
        "components": [
          {
            "type": "text",
            "content": "🤔 **Do you need to register?**",
            "style": "header"
          },
          {
            "type": "question_yesno",
            "question": "Have you been in Switzerland for more than 3 months?",
            "actions": {
              "yes": {
                "action": "show_alert",
                "severity": "warning",
                "message": "⚠️ If you''ve been here more than 3 months, you should have registered already. Contact your municipality immediately!"
              },
              "no": {
                "action": "show_followup",
                "next": "registration_guidance"
              }
            }
          },
          {
            "type": "question_yesno",
            "question": "Do you have a Swiss residence permit card?",
            "actions": {
              "yes": {
                "action": "show_alert",
                "severity": "success",
                "message": "✅ If you have a residence permit card, you''re likely already registered!"
              },
              "no": {
                "action": "show_followup",
                "next": "registration_guidance"
              }
            }
          }
        ]
      }
    ]
  }',
  95
);

-- ============================================
-- COMMIT THE CHANGES
-- ============================================

COMMIT;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

SELECT 
  t.task_number,
  t.title,
  t.category,
  t.is_urgent,
  COUNT(tv.id) as variant_count,
  array_agg(tv.target_audience) as audiences
FROM tasks t
LEFT JOIN task_variants tv ON tv.task_id = t.id
WHERE t.task_number IN (1, 2, 3)
GROUP BY t.id, t.task_number, t.title, t.category, t.is_urgent
ORDER BY t.task_number;


