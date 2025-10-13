-- ============================================================================
-- UPDATE TASK 5 TEXT - REMOVE SPECIAL CHARACTERS
-- ============================================================================

-- Update Task 5 with the corrected text (no special characters)
UPDATE public.task_variants 
SET 
  info_box_content = 'After you register at your Gemeinde, your data goes to the cantonal migration office.

You''ll receive a letter which requires a signature upon receipt. Missing the delivery means you''ll have to pick it up at the post office. The letter will provide an appointment to collect biometric data (fingerprints + photo). Appointments are given usually within the first 1–2 weeks after registration.

After biometrics, the permit card (plastic ID card) is produced by the federal authorities and sent to your Swiss address by registered post.

Processing can take 2–8 weeks depending on canton.

Children also receive a card and are required to provide data at the appointment (no fingerprints for younger kids).

This card is needed for many admin tasks (opening bank account, long-term housing, some insurances, travel).

Fees: usually around CHF 60 - 150 per adult, depending on the canton and permit type'
WHERE variant_name = 'all_users' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 5);

-- Verify the update
SELECT 
  t.task_number,
  t.title,
  tv.variant_name,
  tv.info_box_content
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;
