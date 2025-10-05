-- ====================================
-- TASK 9: ARRANGE ACCIDENT INSURANCE
-- ====================================

-- METHOD 1: Basic (Works with current system)
-- ============================================

INSERT INTO tasks (task_number, module_id, title, category, priority, deadline_days, is_urgent)
VALUES (
  9,
  1,
  'Arrange accident insurance',
  'health',
  65,
  NULL,
  false
);

-- Basic variant (works with existing Dashboard component)
INSERT INTO task_variants (
  task_id,
  target_audience,
  intro,
  info_box,
  initial_question,
  answer_options,
  actions,
  priority
) VALUES (
  9,
  '["all"]',
  'Protect yourself from accidents',
  'In Switzerland, accident insurance (UVG/LAA) is mandatory:

- If you work 8+ hours/week: Your employer MUST cover it (included in salary)
- If you work <8 hours/week: You must add "accident coverage" to your health insurance
- Costs: CHF 0 (if employer covers) or ~CHF 30-40/month extra on health insurance

Check your employment contract under "Versicherungen" or "Insurance"!',
  'Is accident insurance included in your employment contract?',
  '["yes", "no", "not_sure"]',
  '{
    "yes": {
      "action": "mark_complete",
      "message": "Great! You''re covered."
    },
    "no": {
      "action": "show_warning",
      "message": "Important: Add accident coverage to your health insurance immediately!",
      "reminder_days": 3
    },
    "not_sure": {
      "action": "ai_analyze",
      "type": "analyze_contract",
      "message": "Upload your contract and we''ll check for you"
    }
  }',
  100
);

-- ====================================
-- METHOD 2: Advanced (100% Data-Driven with ui_config)
-- ====================================

-- Advanced variant with multiple features
INSERT INTO task_variants (
  task_id,
  target_audience,
  intro,
  info_box,
  ui_config,
  priority
) VALUES (
  9,
  '["all"]',
  'Protect yourself from accidents - UVG/LAA mandatory in Switzerland',
  'Accident insurance (Unfallversicherung/Assurance-accidents) is mandatory in Switzerland.

**How it works:**
- Working ≥8 hours/week: Employer pays (check contract)
- Working <8 hours/week: You add to health insurance
- Cost: CHF 0 (employer) or CHF 30-40/month
- Coverage: Medical costs + disability benefits from accidents

**Important:** This is SEPARATE from health insurance!',
  '{
    "components": [
      {
        "type": "question_multiple",
        "question": "How many hours per week do you work?",
        "options": [
          {
            "value": "full_time",
            "label": "8 or more hours/week",
            "description": "Your employer should cover this"
          },
          {
            "value": "part_time",
            "label": "Less than 8 hours/week",
            "description": "You need to add this to health insurance"
          },
          {
            "value": "not_working",
            "label": "Not working yet",
            "description": "Wait until you start working"
          }
        ],
        "actions": {
          "full_time": {
            "action": "show_followup",
            "next": "check_contract"
          },
          "part_time": {
            "action": "show_followup",
            "next": "add_to_insurance"
          },
          "not_working": {
            "action": "set_reminder",
            "days": 14,
            "message": "Check back when you have your employment contract"
          }
        }
      },
      {
        "type": "conditional",
        "showIf": "full_time",
        "id": "check_contract",
        "components": [
          {
            "type": "checklist",
            "title": "Check your employment contract for:",
            "items": [
              "Section about \"Versicherungen\" or \"Insurance\"",
              "Line mentioning \"Unfallversicherung\" or \"UVG\"",
              "Statement like \"Arbeitgeber übernimmt\" (employer covers)",
              "Look for \"BU\" (Berufsunfähigkeit) and \"NBU\" (Nichtberufsunfähigkeit)"
            ]
          },
          {
            "type": "file_upload",
            "label": "Upload Employment Contract (optional)",
            "accept": ".pdf,.jpg,.png",
            "maxSize": 5000000,
            "helpText": "We can analyze it with AI to confirm your coverage",
            "onUpload": "ai_analyze_contract"
          },
          {
            "type": "question_yesno",
            "question": "Did you find accident insurance mentioned in your contract?",
            "actions": {
              "yes": {
                "action": "mark_complete",
                "message": "Perfect! You''re covered by your employer. ✅"
              },
              "no": {
                "action": "show_alert",
                "severity": "warning",
                "message": "⚠️ Contact your HR immediately! This is legally required for full-time employees."
              }
            }
          }
        ]
      },
      {
        "type": "conditional",
        "showIf": "part_time",
        "id": "add_to_insurance",
        "components": [
          {
            "type": "text",
            "content": "⚠️ **Action Required:** You need to add accident coverage to your health insurance.",
            "style": "warning"
          },
          {
            "type": "comparison_table",
            "title": "How to add accident coverage:",
            "headers": ["Provider", "Online", "Phone", "Estimated Cost"],
            "rows": [
              ["CSS", "My CSS Portal", "0844 277 277", "CHF 35/month"],
              ["Helsana", "myHelsana", "0844 80 81 82", "CHF 38/month"],
              ["Swica", "SWICA Portal", "0800 80 90 80", "CHF 32/month"],
              ["Assura", "Mon Assura", "0848 803 111", "CHF 30/month"]
            ]
          },
          {
            "type": "ai_generate",
            "buttonText": "Generate Email to My Insurance",
            "aiType": "email_template",
            "prompt": "Write email to health insurance requesting to add accident coverage (UVG)",
            "resultFormat": "copyable_text"
          },
          {
            "type": "external_link",
            "text": "Compare Options on Comparis",
            "url": "https://www.comparis.ch/krankenkassen/grundversicherung/zusatzversicherung/unfallversicherung"
          }
        ]
      }
    ]
  }',
  100
);

-- ====================================
-- VARIANT FOR EU/EFTA (Who might not know about this)
-- ====================================

INSERT INTO task_variants (
  task_id,
  target_audience,
  '["EU/EFTA"]',
  intro,
  info_box,
  ui_config,
  priority
) VALUES (
  9,
  '["EU/EFTA"]',
  '⚠️ Important: Swiss accident insurance is DIFFERENT from EU countries',
  'Unlike most EU countries, Switzerland has MANDATORY accident insurance separate from health insurance.

**Key Differences:**
- Not automatically included in health insurance
- Employer pays ONLY if you work 8+ hours/week
- You must actively request it if part-time
- Covers accidents but NOT sickness (that''s health insurance)

**Why this matters:**
If you have an accident without this insurance, you could face massive bills even with health insurance!',
  '{
    "components": [
      {
        "type": "text",
        "content": "🇪🇺 **For EU/EFTA nationals:** This is different from your home country!",
        "style": "info"
      },
      {
        "type": "question_yesno",
        "question": "Do you understand you need BOTH health insurance AND accident insurance?",
        "actions": {
          "yes": {
            "action": "continue",
            "next": "employment_check"
          },
          "no": {
            "action": "show_explainer",
            "video_url": "https://youtube.com/swiss-insurance-explained"
          }
        }
      },
      {
        "type": "question_multiple",
        "id": "employment_check",
        "question": "What''s your employment situation?",
        "options": [
          {
            "value": "full_time",
            "label": "Full-time (8+ hrs/week)",
            "description": "Employer should cover accident insurance"
          },
          {
            "value": "part_time",
            "label": "Part-time (<8 hrs/week)",
            "description": "You must add to health insurance"
          },
          {
            "value": "self_employed",
            "label": "Self-employed / Freelancer",
            "description": "You must arrange both insurances yourself"
          }
        ]
      },
      {
        "type": "checklist",
        "title": "Next Steps:",
        "items": [
          "Check employment contract for \"Unfallversicherung\"",
          "If full-time: Confirm with employer",
          "If part-time: Contact health insurance to add coverage",
          "Keep proof of accident insurance"
        ]
      }
    ]
  }',
  95
);

-- ====================================
-- COMMIT THE CHANGES
-- ====================================

COMMIT;

-- ====================================
-- VERIFICATION QUERY
-- ====================================

SELECT 
  t.task_number,
  t.title,
  tv.target_audience,
  tv.intro,
  CASE 
    WHEN tv.ui_config IS NOT NULL THEN '✅ Advanced (ui_config)'
    ELSE '📋 Basic'
  END as type
FROM tasks t
JOIN task_variants tv ON tv.task_id = t.task_number
WHERE t.task_number = 9
ORDER BY tv.priority DESC;
