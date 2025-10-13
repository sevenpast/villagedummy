-- ============================================================================
-- FIX TASK 4: SCHOOL/KINDERGARTEN REGISTRATION (Corrected Version)
-- ============================================================================

-- First, let's check if Task 4 already exists
SELECT 'Checking existing Task 4:' as info;
SELECT id, task_number, title, is_active FROM public.tasks WHERE task_number = 4;

-- Check if Task 4 already exists and delete it if it does
DELETE FROM public.task_variants 
WHERE task_id IN (SELECT id FROM public.tasks WHERE task_number = 4);

DELETE FROM public.tasks WHERE task_number = 4;

-- Insert Task 4 into the tasks table (using UUID, not string ID)
INSERT INTO public.tasks (
    task_number,
    title,
    description,
    task_type,
    priority,
    display_order,
    is_active
) VALUES (
    4,
    'Register your kids for school right after arrival',
    'School registration is mandatory for all children in Switzerland. Complete this task to ensure your children can attend school.',
    'form',
    1,
    4,
    true
);

-- Get the Task 4 ID for variants
SELECT 'Task 4 ID:' as info;
SELECT id as task_4_id FROM public.tasks WHERE task_number = 4;

-- Insert Task 4 variants for different user types
INSERT INTO public.task_variants (
    task_id,
    variant_name,
    title,
    description,
    intro_text,
    info_box_content,
    question_text,
    actions,
    modal_title,
    modal_content,
    modal_has_reminder,
    modal_default_reminder_days,
    modal_has_email_generator,
    modal_has_pdf_upload,
    modal_has_school_email_generator,
    official_link_url,
    official_link_label,
    checklist_items,
    target_segments
) 
SELECT 
    t.id as task_id,
    'with_children' as variant_name,
    'Register your kids for school right after arrival' as title,
    'School registration is mandatory for all children in Switzerland. Complete this task to ensure your children can attend school.' as description,
    'School registration is one of the most important tasks when moving to Switzerland with children. The process varies by canton and municipality, but it must be completed as soon as possible after arrival.' as intro_text,
    'School registration is mandatory for all children aged 4-16 in Switzerland. You are seeing this task because your profile states that you have children. The registration process varies by canton and municipality, but typically requires: birth certificates, vaccination records, proof of residence, and sometimes language assessments. Contact your local school authority immediately after arrival to avoid delays.' as info_box_content,
    'Have you already registered your children for school?' as question_text,
    '[
        {"label": "Yes", "action": "complete", "style": "success"},
        {"label": "Not yet", "action": "open_modal", "style": "warning"},
        {"label": "Upload School Form", "action": "upload_pdf", "style": "info"}
    ]'::jsonb as actions,
    'School Registration Information' as modal_title,
    'Here you can find detailed information about school registration in your area.' as modal_content,
    true as modal_has_reminder,
    3 as modal_default_reminder_days,
    false as modal_has_email_generator,
    true as modal_has_pdf_upload,
    true as modal_has_school_email_generator,
    null as official_link_url,
    null as official_link_label,
    '[
        "Birth certificate (translated and certified)",
        "Vaccination records (translated and certified)",
        "Proof of residence (rental agreement or property deed)",
        "Previous school records (if applicable)",
        "Language assessment (may be required)",
        "Health insurance certificate",
        "Passport or ID documents"
    ]'::jsonb as checklist_items,
    null::jsonb as target_segments
FROM public.tasks t WHERE t.task_number = 4

UNION ALL

SELECT 
    t.id as task_id,
    'without_children' as variant_name,
    'Register your kids for school right after arrival' as title,
    'School registration is mandatory for all children in Switzerland. Complete this task to ensure your children can attend school.' as description,
    'School registration is one of the most important tasks when moving to Switzerland with children. The process varies by canton and municipality, but it must be completed as soon as possible after arrival.' as intro_text,
    'This task is not relevant for you. You can mark it as completed since your profile indicates you do not have children. School registration is only required for families with children aged 4-16.' as info_box_content,
    'Have you already registered your children for school?' as question_text,
    '[
        {"label": "Yes", "action": "complete", "style": "success"},
        {"label": "Not applicable", "action": "complete", "style": "info"}
    ]'::jsonb as actions,
    'Task Not Applicable' as modal_title,
    'Since you do not have children, this task is not relevant for your situation.' as modal_content,
    false as modal_has_reminder,
    7 as modal_default_reminder_days,
    false as modal_has_email_generator,
    false as modal_has_pdf_upload,
    false as modal_has_school_email_generator,
    null as official_link_url,
    null as official_link_label,
    '[]'::jsonb as checklist_items,
    null::jsonb as target_segments
FROM public.tasks t WHERE t.task_number = 4

UNION ALL

SELECT 
    t.id as task_id,
    'unknown_children' as variant_name,
    'Register your kids for school right after arrival' as title,
    'School registration is mandatory for all children in Switzerland. Complete this task to ensure your children can attend school.' as description,
    'School registration is one of the most important tasks when moving to Switzerland with children. The process varies by canton and municipality, but it must be completed as soon as possible after arrival.' as intro_text,
    'You are seeing this task because we do not know whether you have children. If you have children aged 4-16, school registration is mandatory in Switzerland. If you do not have children, you can mark this task as completed. Please update your profile to help us provide more personalized guidance.' as info_box_content,
    'Have you already registered your children for school?' as question_text,
    '[
        {"label": "Yes", "action": "complete", "style": "success"},
        {"label": "Not yet", "action": "open_modal", "style": "warning"},
        {"label": "I do not have children", "action": "complete", "style": "info"}
    ]'::jsonb as actions,
    'School Registration Information' as modal_title,
    'Here you can find detailed information about school registration in your area.' as modal_content,
    true as modal_has_reminder,
    7 as modal_default_reminder_days,
    false as modal_has_email_generator,
    true as modal_has_pdf_upload,
    true as modal_has_school_email_generator,
    null as official_link_url,
    null as official_link_label,
    '[
        "Birth certificate (translated and certified)",
        "Vaccination records (translated and certified)",
        "Proof of residence (rental agreement or property deed)",
        "Previous school records (if applicable)",
        "Language assessment (may be required)",
        "Health insurance certificate",
        "Passport or ID documents"
    ]'::jsonb as checklist_items,
    null::jsonb as target_segments
FROM public.tasks t WHERE t.task_number = 4;

-- Show final status
SELECT 'Final Task 4 status:' as info;
SELECT t.id, t.task_number, t.title, t.is_active, COUNT(tv.id) as variant_count
FROM public.tasks t
LEFT JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
GROUP BY t.id, t.task_number, t.title, t.is_active;

SELECT 'Task 4 variants:' as info;
SELECT tv.variant_name, t.is_active 
FROM public.task_variants tv 
JOIN public.tasks t ON tv.task_id = t.id 
WHERE t.task_number = 4;

SELECT 'SUCCESS: Task 4 (School Registration) fixed and implemented!' as status;
