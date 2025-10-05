-- ============================================
-- VILLAGE SEED DATA - MODULE 1
-- Run this AFTER the schema setup (01-database-schema.sql)
-- ============================================

-- Instructions:
-- 1. Ensure schema is deployed first
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste this file
-- 4. Click "Run"

-- ============================================
-- MODULE
-- ============================================

INSERT INTO modules (id, title, description, display_order)
VALUES (
  1,
  'Welcome to Switzerland: Your first 90 days',
  'Essential tasks to complete during your first three months in Switzerland',
  1
);

-- ============================================
-- TASKS (All 18)
-- ============================================

INSERT INTO tasks (task_number, module_id, title, category, is_urgent, deadline_days, priority) VALUES
(1, 1, 'Secure residence permit / visa', 'legal', false, null, 100),
(2, 1, 'Find housing', 'housing', false, null, 90),
(3, 1, 'Register at your Gemeinde (municipality)', 'legal', true, 14, 95),
(4, 1, 'Register for school/kindergarten', 'family', true, 7, 85),
(5, 1, 'Receive residence permit card', 'legal', false, null, 80),
(6, 1, 'Open a Swiss bank account', 'admin', false, null, 75),
(7, 1, 'Arrange mobile phone & internet plan', 'admin', false, null, 70),
(8, 1, 'Choose health insurance provider', 'health', true, 90, 88),
(9, 1, 'Arrange accident insurance', 'health', false, null, 65),
(10, 1, 'Apply for daycare spot', 'family', false, null, 60),
(11, 1, 'Find family doctor / pediatrician', 'health', false, null, 55),
(12, 1, 'Learn about Emergency care', 'health', false, null, 50),
(13, 1, 'Get liability & household insurance', 'admin', false, null, 45),
(14, 1, 'Register for waste disposal & recycling system', 'admin', false, null, 40),
(15, 1, 'Public transport', 'admin', false, null, 35),
(16, 1, 'Exchange driver''s license', 'legal', false, 365, 30),
(17, 1, 'Confirm AHV/AVS number', 'admin', false, null, 25),
(18, 1, 'Learn about the Serafe bill', 'admin', false, null, 20);

-- ============================================
-- TASK VARIANTS
-- ============================================

-- Task 1: Secure residence permit (EU/EFTA)
INSERT INTO task_variants (task_id, target_audience, intro, info_box, initial_question, answer_options, actions, priority) VALUES
(1, '["EU/EFTA"]', 
'Make sure your legal right to stay in Switzerland is secured',
'Since you are a citizen of {country_of_origin}:

- You may enter Switzerland without a visa and stay up to 90 days as a tourist.
- To live and work here, you need one of the following residence/work permits: L (short-term) or B (longer-term).
- Your Swiss employer must apply for this permit before you start work.
- Once approved, you can enter Switzerland visa-free and must register at your Gemeinde within 14 days.',
'Do you already have a work visa / permit for Switzerland?',
'["Yes", "Not yet"]',
'{"Yes": {"action": "mark_done"}, "Not yet": {"action": "show_reminder", "message": "Check the status with your employer", "default_days": 7}}',
1);

-- Task 1: Secure residence permit (Non-EU visa-required)
INSERT INTO task_variants (task_id, target_audience, intro, info_box, initial_question, answer_options, actions, priority) VALUES
(1, '["Non-EU/EFTA", "visa-required"]',
'Make sure your legal right to stay in Switzerland is secured',
'Since you are a citizen of {country_of_origin}:

- Non-EU/EFTA citizens require a permit to live and work in Switzerland.
- Your Swiss employer must apply for a work permit on your behalf.
- After approval, the Swiss embassy will issue you a D visa.
- After arrival, you must register at your Gemeinde within 14 days.',
'Do you already have a work visa / permit for Switzerland?',
'["Yes", "Not yet"]',
'{"Yes": {"action": "mark_done"}, "Not yet": {"action": "show_reminder", "message": "Contact Swiss embassy for D visa", "default_days": 7}}',
2);

-- Task 2: Find housing
INSERT INTO task_variants (task_id, target_audience, intro, info_box, initial_question, answer_options, ui_config, priority) VALUES
(2, '["all"]',
'The first step to building a home is finding a place that fits your needs.',
'~60% of Swiss residents rent; competition is high in big cities (Zurich, Geneva, Basel).

Key facts:
- Room count: 2.5 rooms = 1 bedroom + 1 living room
- Deposit: typically 1–3 months rent
- Application dossier required (passport, permit, references)
- Utilities may be included or billed separately
- Beware of scams!',
'Have you already found a permanent residence?',
'["Yes", "Not yet"]',
'{"has_form": true, "ai_features": {"property_suggestions": true, "budget_analysis": true, "motivational_letter_generator": true}}',
1);

-- Task 3: Register at Gemeinde (EU/EFTA)
INSERT INTO task_variants (task_id, target_audience, intro, info_box, initial_question, answer_options, ui_config, priority) VALUES
(3, '["EU/EFTA"]',
'Make your residence official within 14 days of arrival',
'You must register at your Gemeinde (municipality) within 14 days.

Documents usually required:
- Passport/ID for each family member
- Employment contract
- Rental contract
- Passport photos
- Proof of health insurance (or provide within 3 months)

Registration is mandatory for access to all services.',
'Have you already registered yourself?',
'["Yes", "Not yet"]',
'{"ai_features": {"fetch_municipality_requirements": true, "generate_inquiry_email": true}}',
1);

-- Task 4: School registration (with kids)
INSERT INTO task_variants (task_id, target_audience, intro, info_box, initial_question, answer_options, ui_config, priority) VALUES
(4, '["with_kids"]',
'Register your kids for school right after arrival',
'School attendance is compulsory from age 4–6 (varies by canton).

Documents usually required:
- Child''s passport/ID
- Birth certificate
- Residence permit
- Proof of address
- Immunization records
- Previous school reports (if available)

Kindergarten is mandatory in most cantons.',
'Have you already registered your child(ren) for school?',
'["Yes", "Not yet"]',
'{"ai_features": {"fetch_school_requirements": true, "auto_fill_pdf_forms": true, "generate_inquiry_email": true}}',
1);

-- Task 5: Receive permit card
INSERT INTO task_variants (task_id, target_audience, intro, info_box, initial_question, answer_options, priority) VALUES
(5, '["all"]',
'The last step to your Swiss residence permit',
'After Gemeinde registration:
1. You''ll receive a biometric appointment letter
2. Attend appointment for fingerprints + photo
3. Permit card sent by registered post (2–8 weeks)

This card is needed for:
- Opening bank accounts
- Long-term housing
- Some insurances
- Travel

Fees: CHF 60–150 per adult',
'Have you received your permit card yet?',
'["Yes", "Not yet"]',
1);

-- ============================================
-- TASK DEPENDENCIES
-- ============================================

INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type) VALUES
(3, 1, 'required'),  -- Gemeinde requires Permit
(4, 3, 'required'),  -- School requires Gemeinde
(5, 3, 'required'),  -- Permit card requires Gemeinde
(6, 3, 'recommended'); -- Bank account recommended after Gemeinde

-- ============================================
-- AI PROMPTS
-- ============================================

INSERT INTO ai_prompts (operation_type, system_prompt, version, is_active) VALUES
('scrape_and_summarize',
'You are an expert at extracting and summarizing official Swiss municipal information.

Focus on:
- Required documents (list ALL)
- Fees (exact amounts in CHF)
- Office hours
- Deadlines
- Special requirements for foreigners

Be accurate, concise, and beginner-friendly.',
'1.0', true),

('generate_email',
'You are writing official correspondence to Swiss municipal offices.

Style guidelines:
- Formal German/French/Italian (based on region)
- Use "Sie" (formal you)
- Professional but friendly tone
- Clear subject lines
- Include all relevant details

Always output valid JSON with subject, body, and recipient fields.',
'1.0', true),

('generate_property_suggestions',
'You are a Swiss real estate expert helping international newcomers find suitable housing.

Consider:
- Commute time to work
- School proximity (for families)
- Public transport connections
- Price positioning vs local market
- Neighborhood characteristics

Be realistic about competition and requirements.',
'1.0', true),

('generate_motivational_letter',
'You are writing compelling motivational letters for Swiss rental applications.

Structure:
1. Professional introduction
2. Why this specific property appeals
3. Highlight reliability
4. Mention lifestyle compatibility
5. Express enthusiasm

Tone: Professional yet warm, maximum 300 words',
'1.0', true);

-- ============================================
-- SAMPLE MUNICIPALITY DATA
-- ============================================

INSERT INTO municipality_data (municipality, canton, official_website, contact_email, contact_phone, office_hours, registration_fee_chf, permit_card_fee_chf) VALUES
('Zürich', 'Zürich', 'https://www.stadt-zuerich.ch', 'einwohnerkontrolle@zuerich.ch', '+41 44 412 31 60',
'{"Monday": "08:00-11:30, 13:30-18:00", "Tuesday": "08:00-11:30, 13:30-16:30", "Wednesday": "08:00-11:30, 13:30-16:30", "Thursday": "08:00-11:30, 13:30-18:00", "Friday": "08:00-11:30, 13:30-16:30"}',
50, 100),

('Geneva', 'Geneva', 'https://www.ge.ch', 'ocpm@etat.ge.ch', '+41 22 546 46 46',
'{"Monday": "08:30-12:00, 14:00-16:30", "Tuesday": "08:30-12:00, 14:00-16:30", "Wednesday": "08:30-12:00, 14:00-16:30", "Thursday": "08:30-12:00, 14:00-16:30", "Friday": "08:30-12:00, 14:00-16:30"}',
60, 120);

-- ============================================
-- SEED COMPLETE
-- Next: Setup your TypeScript services
-- ============================================
