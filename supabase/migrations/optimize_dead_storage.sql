-- ============================================================
-- MARVEL SLICE — DB OPTIMISATION (remove dead storage)
-- Safe to run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- 1. Drop fully-unused table `related_courses` (0 references in code).
--    "Related courses" is computed at runtime via sibling/tag fallback.
drop table if exists related_courses;

-- 2. Drop redundant JSONB columns on training_programs.
--    TrainingEditor/TrainingWizard no longer write these (payload edited to
--    send only the child-table versions). Public pages read ONLY the child
--    tables (training_modules, training_skills, training_benefits), so the
--    JSONB copies were stored twice and never read.
alter table training_programs drop column if exists modules;
alter table training_programs drop column if exists skills;
alter table training_programs drop column if exists benefits;

-- 3. Drop services.highlights JSONB (was edited in admin but never rendered
--    publicly — ServiceEditor "Highlights" field and ServiceWizard payload
--    removed; public page reads eligibility_highlights instead).
alter table services drop column if exists highlights;

-- 4. Report legacy tables that are written but never read back:
--    - enquiries      : insert-only (ServiceDetail / TrainingDetail forms);
--                       no admin viewer exists. Keep the table for the forms,
--                       or add an admin inbox to surface the data.
--    - course_fees    : pricing was removed from the course wizard/editor.
--                       Only the CourseBrochure PDF export still reads it.
--                       Kept intentionally for the brochure.
--    - career-uploads : storage bucket still used by Career resume uploads.

-- 5. Add index used by the admin submissions inbox (ordered by created_at).
create index if not exists idx_about_submissions_created
  on about_submissions (created_at desc);
