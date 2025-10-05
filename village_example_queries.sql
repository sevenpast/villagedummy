-- ============================================
-- EXAMPLE QUERIES für Village Database
-- ============================================

-- ============================================
-- 1. USER MANAGEMENT
-- ============================================

-- Neuen User erstellen (nach Supabase Auth Signup)
INSERT INTO users (
  auth_user_id,
  email,
  first_name,
  last_name,
  country_of_origin,
  municipality,
  canton,
  has_kids,
  months_in_switzerland,
  arrival_date
) VALUES (
  'auth-uuid-from-supabase',
  'max.mustermann@example.com',
  'Max',
  'Mustermann',
  'Germany',
  'Zürich',
  'Zürich',
  true,
  2,
  '2025-08-01'
);
-- → Trigger assign_user_segments läuft automatisch und erstellt Segments!

-- User-Profil abrufen
SELECT 
  u.*,
  array_agg(us.segment_name) as segments
FROM users u
LEFT JOIN user_segments us ON u.id = us.user_id
WHERE u.email = 'max.mustermann@example.com'
GROUP BY u.id;

-- Alle User einer Gemeinde finden
SELECT 
  first_name, 
  last_name, 
  email, 
  months_in_switzerland
FROM users
WHERE municipality = 'Zürich'
ORDER BY arrival_date DESC;

-- ============================================
-- 2. TASKS ABRUFEN (mit Variants)
-- ============================================

-- Alle Tasks für einen User laden (mit passenden Variants)
WITH user_segments_list AS (
  SELECT array_agg(segment_name) as segments
  FROM user_segments
  WHERE user_id = 'user-uuid-here'
)
SELECT 
  t.id,
  t.task_number,
  t.title,
  t.is_urgent,
  t.deadline_days,
  tv.intro,
  tv.info_box,
  tv.initial_question,
  tv.answer_options,
  tv.actions,
  uts.status,
  uts.user_answer
FROM tasks t
JOIN task_variants tv ON t.id = tv.task_id
LEFT JOIN user_task_status uts ON t.id = uts.task_id 
  AND uts.user_id = 'user-uuid-here'
WHERE t.module_id = 1
  AND tv.target_audience ?| (SELECT segments FROM user_segments_list)
ORDER BY t.priority DESC;

-- Task-Status für User aktualisieren
INSERT INTO user_task_status (
  user_id,
  task_id,
  status,
  user_answer,
  started_at
) VALUES (
  'user-uuid',
  1,
  'in_progress',
  'Not yet',
  NOW()
)
ON CONFLICT (user_id, task_id) 
DO UPDATE SET
  status = EXCLUDED.status,
  user_answer = EXCLUDED.user_answer,
  last_interaction_at = NOW();

-- Task als erledigt markieren
UPDATE user_task_status
SET 
  status = 'done',
  completed_at = NOW()
WHERE user_id = 'user-uuid'
  AND task_id = 1;

-- ============================================
-- 3. REMINDERS
-- ============================================

-- Reminder erstellen
INSERT INTO reminders (
  user_id,
  task_id,
  message,
  scheduled_for,
  reminder_type
) VALUES (
  'user-uuid',
  1,
  'Don''t forget to check your visa status with your employer',
  NOW() + INTERVAL '7 days',
  'task_deadline'
);

-- Fällige Reminders finden (für Cron Job)
SELECT 
  r.id,
  r.user_id,
  u.email,
  u.first_name,
  r.message,
  t.title as task_title
FROM reminders r
JOIN users u ON r.user_id = u.id
LEFT JOIN tasks t ON r.task_id = t.id
WHERE r.status = 'pending'
  AND r.scheduled_for <= NOW()
ORDER BY r.scheduled_for;

-- Reminder als gesendet markieren
UPDATE reminders
SET 
  status = 'sent',
  sent_at = NOW()
WHERE id = 'reminder-uuid';

-- ============================================
-- 4. AI OPERATIONS TRACKING
-- ============================================

-- AI Operation loggen
INSERT INTO ai_operations (
  user_id,
  task_id,
  operation_type,
  input_data,
  output_data,
  input_tokens,
  output_tokens,
  total_tokens,
  cost_usd,
  model_name,
  status,
  duration_ms
) VALUES (
  'user-uuid',
  3,
  'scrape_and_summarize',
  '{"municipality": "Zürich", "task": "gemeinde_registration"}',
  '{"summary": "Required documents: Passport, rental contract...", "source_url": "..."}',
  1200,
  350,
  1550,
  0.000285,
  'gpt-4o-mini',
  'success',
  2340
);

-- Kosten pro User berechnen
SELECT 
  u.email,
  u.first_name,
  COUNT(ao.id) as total_operations,
  SUM(ao.total_tokens) as total_tokens,
  SUM(ao.cost_usd) as total_cost_usd,
  ROUND(AVG(ao.duration_ms)::numeric, 2) as avg_duration_ms
FROM users u
LEFT JOIN ai_operations ao ON u.id = ao.user_id
WHERE ao.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, u.first_name
ORDER BY total_cost_usd DESC;

-- Gesamtkosten pro Operation-Type
SELECT 
  operation_type,
  COUNT(*) as call_count,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_call,
  ROUND(AVG(duration_ms)::numeric, 2) as avg_duration_ms
FROM ai_operations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY operation_type
ORDER BY total_cost_usd DESC;

-- Cache Hit Rate analysieren
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits,
  ROUND(
    (COUNT(*) FILTER (WHERE cache_hit = true)::float / COUNT(*)::float * 100)::numeric,
    2
  ) as cache_hit_rate_percent
FROM ai_operations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- 5. MUNICIPALITY DATA
-- ============================================

-- Gemeinde-Daten abrufen (mit Caching)
SELECT 
  municipality,
  canton,
  official_website,
  contact_email,
  office_hours,
  gemeinde_registration_requirements,
  registration_fee_chf,
  data_last_fetched_at
FROM municipality_data
WHERE municipality = 'Zürich'
  AND canton = 'Zürich';

-- Prüfen ob Daten veraltet (älter als 7 Tage)
SELECT 
  municipality,
  canton,
  data_last_fetched_at,
  NOW() - data_last_fetched_at as age
FROM municipality_data
WHERE data_last_fetched_at < NOW() - INTERVAL '7 days'
  OR data_last_fetched_at IS NULL;

-- Gemeinde-Daten aktualisieren (nach AI-Scraping)
INSERT INTO municipality_data (
  municipality,
  canton,
  gemeinde_registration_requirements,
  registration_fee_chf,
  office_hours,
  data_last_fetched_at,
  data_source
) VALUES (
  'Basel',
  'Basel-Stadt',
  '{"documents": ["Passport", "Employment contract", "Rental contract"], "fees": 50}',
  50,
  '{"Monday": "08:00-12:00, 14:00-17:00"}',
  NOW(),
  'ai_scrape'
)
ON CONFLICT (municipality, canton)
DO UPDATE SET
  gemeinde_registration_requirements = EXCLUDED.gemeinde_registration_requirements,
  registration_fee_chf = EXCLUDED.registration_fee_chf,
  office_hours = EXCLUDED.office_hours,
  data_last_fetched_at = NOW(),
  updated_at = NOW();

-- ============================================
-- 6. DOCUMENTS & BUNDLES
-- ============================================

-- Dokument hochladen
INSERT INTO documents (
  user_id,
  file_name,
  file_size,
  file_type,
  storage_path,
  document_type,
  task_id
) VALUES (
  'user-uuid',
  'passport_max_mustermann.pdf',
  1048576,
  'pdf',
  'user-uuid/documents/passport_max_mustermann.pdf',
  'passport',
  1
);

-- Alle Dokumente eines Users
SELECT 
  id,
  file_name,
  document_type,
  uploaded_at,
  is_verified,
  t.title as related_task
FROM documents d
LEFT JOIN tasks t ON d.task_id = t.id
WHERE d.user_id = 'user-uuid'
ORDER BY d.uploaded_at DESC;

-- Document Bundle erstellen (Housing Application)
INSERT INTO document_bundles (
  user_id,
  bundle_name,
  bundle_type,
  document_ids,
  generated_letter,
  generated_letter_language
) VALUES (
  'user-uuid',
  'Housing Application for Zürich Apartment',
  'housing_application',
  '["doc-uuid-1", "doc-uuid-2", "doc-uuid-3"]',
  'Dear Sir or Madam, I am writing to express my interest...',
  'de'
);

-- ============================================
-- 7. PROPERTY SEARCH
-- ============================================

-- Property Search speichern
INSERT INTO property_searches (
  user_id,
  search_type,
  budget_min,
  budget_max,
  num_rooms,
  location,
  location_radius_km,
  parking_required,
  pets_allowed,
  available_from
) VALUES (
  'user-uuid',
  'permanent',
  1500,
  2500,
  3.5,
  'Zürich',
  10,
  true,
  false,
  '2025-10-01'
);

-- Letzte Property Search eines Users
SELECT *
FROM property_searches
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 1;

-- AI Suggestions zu Search hinzufügen
UPDATE property_searches
SET 
  ai_suggestions = '[
    {
      "address": "Musterstrasse 123, 8001 Zürich",
      "rent": 2200,
      "rooms": 3.5,
      "url": "https://homegate.ch/...",
      "match_reason": "Perfect fit for your budget and location..."
    }
  ]',
  suggestions_generated_at = NOW()
WHERE id = 'search-uuid';

-- ============================================
-- 8. ANALYTICS
-- ============================================

-- User Events loggen
INSERT INTO user_events (
  user_id,
  event_type,
  event_category,
  task_id,
  metadata
) VALUES (
  'user-uuid',
  'task_completed',
  'task',
  1,
  '{"time_spent_seconds": 180}'
);

-- Dashboard Stats: Task Completion Rate
SELECT 
  t.task_number,
  t.title,
  COUNT(DISTINCT uts.user_id) FILTER (WHERE uts.status = 'done') as completed_users,
  COUNT(DISTINCT uts.user_id) as total_users_started,
  ROUND(
    (COUNT(DISTINCT uts.user_id) FILTER (WHERE uts.status = 'done')::float / 
     NULLIF(COUNT(DISTINCT uts.user_id), 0)::float * 100)::numeric,
    2
  ) as completion_rate_percent
FROM tasks t
LEFT JOIN user_task_status uts ON t.id = uts.task_id
WHERE t.module_id = 1
GROUP BY t.id, t.task_number, t.title
ORDER BY t.task_number;

-- User Progress Overview
SELECT 
  u.first_name,
  u.last_name,
  u.email,
  COUNT(uts.id) FILTER (WHERE uts.status = 'done') as tasks_completed,
  COUNT(uts.id) FILTER (WHERE uts.status = 'in_progress') as tasks_in_progress,
  COUNT(uts.id) as total_tasks_started,
  u.months_in_switzerland
FROM users u
LEFT JOIN user_task_status uts ON u.id = uts.user_id
GROUP BY u.id
ORDER BY tasks_completed DESC;

-- Time to Complete per Task
SELECT 
  t.task_number,
  t.title,
  AVG(EXTRACT(EPOCH FROM (uts.completed_at - uts.shown_at)) / 3600) as avg_hours_to_complete,
  MIN(EXTRACT(EPOCH FROM (uts.completed_at - uts.shown_at)) / 3600) as min_hours,
  MAX(EXTRACT(EPOCH FROM (uts.completed_at - uts.shown_at)) / 3600) as max_hours
FROM tasks t
JOIN user_task_status uts ON t.id = uts.task_id
WHERE uts.status = 'done'
  AND uts.completed_at IS NOT NULL
  AND uts.shown_at IS NOT NULL
GROUP BY t.id, t.task_number, t.title
ORDER BY t.task_number;

-- ============================================
-- 9. ADMIN QUERIES
-- ============================================

-- Alle User die Gemeinde Registration nicht gemacht haben (nach 14 Tagen)
SELECT 
  u.first_name,
  u.last_name,
  u.email,
  u.arrival_date,
  NOW()::date - u.arrival_date::date as days_since_arrival,
  uts.status
FROM users u
LEFT JOIN user_task_status uts ON u.id = uts.user_id AND uts.task_id = 3
WHERE u.arrival_date IS NOT NULL
  AND NOW()::date - u.arrival_date::date > 14
  AND (uts.status IS NULL OR uts.status != 'done')
ORDER BY days_since_arrival DESC;

-- Nicht-verifizierte User
SELECT 
  first_name,
  last_name,
  email,
  created_at,
  NOW() - created_at as account_age
FROM users
WHERE is_verified = false
ORDER BY created_at;

-- ============================================
-- 10. CLEANUP QUERIES
-- ============================================

-- Alte AI Cache Entries löschen
DELETE FROM ai_cache
WHERE expires_at < NOW();

-- Gesendete Reminders älter als 30 Tage archivieren/löschen
DELETE FROM reminders
WHERE status = 'sent'
  AND sent_at < NOW() - INTERVAL '30 days';

-- Abgelaufene Dokumente markieren
UPDATE documents
SET is_verified = false
WHERE expires_at < NOW()
  AND is_verified = true;
