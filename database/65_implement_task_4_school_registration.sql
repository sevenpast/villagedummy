-- ============================================================================
-- IMPLEMENT TASK 4: SCHOOL/KINDERGARTEN REGISTRATION
-- ============================================================================

-- Insert Task 4 into the tasks table
INSERT INTO public.tasks (
    id,
    task_number,
    title,
    description,
    task_type,
    priority,
    display_order,
    is_active,
    created_at,
    updated_at
) VALUES (
    'task-4-school-registration',
    4,
    'Register your kids for school right after arrival',
    'School registration is mandatory for all children in Switzerland. Complete this task to ensure your children can attend school.',
    'form',
    1,
    4,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    task_type = EXCLUDED.task_type,
    priority = EXCLUDED.priority,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert Task 4 variants for different user types
INSERT INTO public.task_variants (
    id,
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
    target_segments,
    created_at,
    updated_at
) VALUES 
-- Variant for users with children (has_children = true)
(
    'task-4-variant-with-children',
    'task-4-school-registration',
    'with_children',
    'Register your kids for school right after arrival',
    'School registration is mandatory for all children in Switzerland. Complete this task to ensure your children can attend school.',
    'School registration is one of the most important tasks when moving to Switzerland with children. The process varies by canton and municipality, but it must be completed as soon as possible after arrival.',
    'School registration is mandatory for all children aged 4-16 in Switzerland. You are seeing this task because your profile states that you have children. The registration process varies by canton and municipality, but typically requires: birth certificates, vaccination records, proof of residence, and sometimes language assessments. Contact your local school authority immediately after arrival to avoid delays.',
    'Have you already registered your children for school?',
    '[
        {"label": "Yes", "action": "complete", "style": "success"},
        {"label": "Not yet", "action": "open_modal", "style": "warning"},
        {"label": "Upload School Form", "action": "upload_pdf", "style": "info"}
    ]',
    'School Registration Information',
    'Here you can find detailed information about school registration in your area.',
    true,
    3,
    false,
    true,
    true,
    null,
    null,
    '[
        "Birth certificate (translated and certified)",
        "Vaccination records (translated and certified)",
        "Proof of residence (rental agreement or property deed)",
        "Previous school records (if applicable)",
        "Language assessment (may be required)",
        "Health insurance certificate",
        "Passport or ID documents"
    ]',
    null,
    NOW(),
    NOW()
),

-- Variant for users without children (has_children = false)
(
    'task-4-variant-without-children',
    'task-4-school-registration',
    'without_children',
    'Register your kids for school right after arrival',
    'School registration is mandatory for all children in Switzerland. Complete this task to ensure your children can attend school.',
    'School registration is one of the most important tasks when moving to Switzerland with children. The process varies by canton and municipality, but it must be completed as soon as possible after arrival.',
    'This task is not relevant for you. You can mark it as completed since your profile indicates you do not have children. School registration is only required for families with children aged 4-16.',
    'Have you already registered your children for school?',
    '[
        {"label": "Yes", "action": "complete", "style": "success"},
        {"label": "Not applicable", "action": "complete", "style": "info"}
    ]',
    'Task Not Applicable',
    'Since you do not have children, this task is not relevant for your situation.',
    false,
    7,
    false,
    false,
    false,
    null,
    null,
    '[]',
    null,
    NOW(),
    NOW()
),

-- Variant for users with unknown children status (has_children = null)
(
    'task-4-variant-unknown-children',
    'task-4-school-registration',
    'unknown_children',
    'Register your kids for school right after arrival',
    'School registration is mandatory for all children in Switzerland. Complete this task to ensure your children can attend school.',
    'School registration is one of the most important tasks when moving to Switzerland with children. The process varies by canton and municipality, but it must be completed as soon as possible after arrival.',
    'You are seeing this task because we do not know whether you have children. If you have children aged 4-16, school registration is mandatory in Switzerland. If you do not have children, you can mark this task as completed. Please update your profile to help us provide more personalized guidance.',
    'Have you already registered your children for school?',
    '[
        {"label": "Yes", "action": "complete", "style": "success"},
        {"label": "Not yet", "action": "open_modal", "style": "warning"},
        {"label": "I do not have children", "action": "complete", "style": "info"}
    ]',
    'School Registration Information',
    'Here you can find detailed information about school registration in your area.',
    true,
    7,
    false,
    true,
    true,
    null,
    null,
    '[
        "Birth certificate (translated and certified)",
        "Vaccination records (translated and certified)",
        "Proof of residence (rental agreement or property deed)",
        "Previous school records (if applicable)",
        "Language assessment (may be required)",
        "Health insurance certificate",
        "Passport or ID documents"
    ]',
    null,
    NOW(),
    NOW()
)

ON CONFLICT (id) DO UPDATE SET
    task_id = EXCLUDED.task_id,
    variant_name = EXCLUDED.variant_name,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    intro_text = EXCLUDED.intro_text,
    info_box_content = EXCLUDED.info_box_content,
    question_text = EXCLUDED.question_text,
    actions = EXCLUDED.actions,
    modal_title = EXCLUDED.modal_title,
    modal_content = EXCLUDED.modal_content,
    modal_has_reminder = EXCLUDED.modal_has_reminder,
    modal_default_reminder_days = EXCLUDED.modal_default_reminder_days,
    modal_has_email_generator = EXCLUDED.modal_has_email_generator,
    modal_has_pdf_upload = EXCLUDED.modal_has_pdf_upload,
    modal_has_school_email_generator = EXCLUDED.modal_has_school_email_generator,
    official_link_url = EXCLUDED.official_link_url,
    official_link_label = EXCLUDED.official_link_label,
    checklist_items = EXCLUDED.checklist_items,
    target_segments = EXCLUDED.target_segments,
    updated_at = NOW();

-- Update the get_user_tasks function to handle Task 4 variants based on has_children status
CREATE OR REPLACE FUNCTION public.get_user_tasks(
    user_uuid UUID,
    module_num INTEGER DEFAULT 1
)
RETURNS TABLE (
    task_id TEXT,
    task_number INTEGER,
    title TEXT,
    priority INTEGER,
    display_order INTEGER,
    variant_id TEXT,
    variant_name TEXT,
    intro_text TEXT,
    info_box_content TEXT,
    question_text TEXT,
    actions JSONB,
    modal_title TEXT,
    modal_content TEXT,
    modal_has_reminder BOOLEAN,
    modal_default_reminder_days INTEGER,
    modal_has_email_generator BOOLEAN,
    modal_has_pdf_upload BOOLEAN,
    modal_has_school_email_generator BOOLEAN,
    official_link_url TEXT,
    official_link_label TEXT,
    checklist_items JSONB,
    user_status TEXT,
    user_completed_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (t.id)
        t.id::TEXT as task_id,
        t.task_number,
        t.title,
        t.priority,
        t.display_order,
        tv.id::TEXT as variant_id,
        tv.variant_name,
        tv.intro_text,
        tv.info_box_content,
        tv.question_text,
        tv.actions,
        tv.modal_title,
        tv.modal_content,
        tv.modal_has_reminder,
        tv.modal_default_reminder_days,
        tv.modal_has_email_generator,
        tv.modal_has_pdf_upload,
        tv.modal_has_school_email_generator,
        tv.official_link_url,
        tv.official_link_label,
        tv.checklist_items,
        COALESCE(utp.status, 'not_started') as user_status,
        utp.completed_at as user_completed_at
    FROM public.tasks t
    JOIN public.task_variants tv ON t.id = tv.task_id
    LEFT JOIN public.user_task_progress utp ON t.id = utp.task_id AND utp.user_id = user_uuid
    LEFT JOIN public.user_profiles up ON up.user_id = user_uuid
    WHERE t.is_active = true
    AND t.task_number = module_num
    ORDER BY t.id, 
        CASE 
            -- Task 4: Prioritize variants based on has_children status
            WHEN t.id = 'task-4-school-registration' THEN
                CASE 
                    WHEN up.has_children = true AND tv.variant_name = 'with_children' THEN 1
                    WHEN up.has_children = false AND tv.variant_name = 'without_children' THEN 1
                    WHEN up.has_children IS NULL AND tv.variant_name = 'unknown_children' THEN 1
                    ELSE 2
                END
            -- Task 3: Prioritize variants based on visa status
            WHEN t.id = 'task-3-residence-registration' THEN
                CASE 
                    WHEN tv.variant_name = 'eu_efta' THEN 1
                    WHEN tv.variant_name = 'visa_exempt' THEN 2
                    WHEN tv.variant_name = 'visa_required' THEN 3
                    WHEN tv.variant_name = 'no_info' THEN 4
                    ELSE 5
                END
            -- Default priority for other tasks
            ELSE 1
        END,
        tv.created_at;
END;
$$;

-- Success message
SELECT 'SUCCESS: Task 4 (School Registration) implemented successfully!' as status;
