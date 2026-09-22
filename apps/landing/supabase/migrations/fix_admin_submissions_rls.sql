-- MARVEL SLICE LANDING — FAILSAFE ADMIN SUBMISSIONS RLS FIX
-- Safely drops any existing policy names before re-creating them.

DO $$ 
DECLARE
    tbl TEXT;
    pol RECORD;
    target_tables TEXT[] := ARRAY[
        'form_submissions', 'contact_submissions', 'about_submissions', 'career_submissions',
        'career_contact_submissions', 'mock_exam_submissions', 'custom_mock_exam_submissions',
        'custom_mock_exam_registrations', 'brochure_downloads', 'banking_enquiries',
        'course_enquiries', 'upcoming_class_registrations', 'upcoming_course_interests',
        'newsletter_subscribers', 'conversations', 'messages', 'enquiries'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            
            -- Drop ALL existing policies on this table
            FOR pol IN (
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = tbl
            ) LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
            END LOOP;

            -- Re-create clean open RLS policies
            EXECUTE format('CREATE POLICY public_select_%I ON public.%I FOR SELECT TO anon, authenticated USING (true);', tbl, tbl);
            EXECUTE format('CREATE POLICY public_insert_%I ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true);', tbl, tbl);
            EXECUTE format('CREATE POLICY public_update_%I ON public.%I FOR UPDATE TO anon, authenticated USING (true);', tbl, tbl);
            EXECUTE format('CREATE POLICY public_delete_%I ON public.%I FOR DELETE TO anon, authenticated USING (true);', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- DIRECT EXPLICIT SAFE SQL STATEMENTS
-- Drop existing policies first then recreate

-- Form Submissions
ALTER TABLE IF EXISTS public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_form_submissions ON public.form_submissions;
DROP POLICY IF EXISTS anon_insert_form_submissions ON public.form_submissions;
DROP POLICY IF EXISTS public_select_form_submissions ON public.form_submissions;
DROP POLICY IF EXISTS public_insert_form_submissions ON public.form_submissions;
DROP POLICY IF EXISTS public_update_form_submissions ON public.form_submissions;
DROP POLICY IF EXISTS public_delete_form_submissions ON public.form_submissions;
CREATE POLICY public_select_form_submissions ON public.form_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_form_submissions ON public.form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_form_submissions ON public.form_submissions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_form_submissions ON public.form_submissions FOR DELETE TO anon, authenticated USING (true);

-- Contact Submissions
ALTER TABLE IF EXISTS public.contact_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_contact_submissions ON public.contact_submissions;
DROP POLICY IF EXISTS anon_insert_contact_submissions ON public.contact_submissions;
DROP POLICY IF EXISTS public_select_contact_submissions ON public.contact_submissions;
DROP POLICY IF EXISTS public_insert_contact_submissions ON public.contact_submissions;
DROP POLICY IF EXISTS public_update_contact_submissions ON public.contact_submissions;
DROP POLICY IF EXISTS public_delete_contact_submissions ON public.contact_submissions;
CREATE POLICY public_select_contact_submissions ON public.contact_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_contact_submissions ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_contact_submissions ON public.contact_submissions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_contact_submissions ON public.contact_submissions FOR DELETE TO anon, authenticated USING (true);

-- About Submissions
ALTER TABLE IF EXISTS public.about_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_about_submissions ON public.about_submissions;
DROP POLICY IF EXISTS anon_insert_about_submissions ON public.about_submissions;
DROP POLICY IF EXISTS public_select_about_submissions ON public.about_submissions;
DROP POLICY IF EXISTS public_insert_about_submissions ON public.about_submissions;
DROP POLICY IF EXISTS public_update_about_submissions ON public.about_submissions;
DROP POLICY IF EXISTS public_delete_about_submissions ON public.about_submissions;
CREATE POLICY public_select_about_submissions ON public.about_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_about_submissions ON public.about_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_about_submissions ON public.about_submissions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_about_submissions ON public.about_submissions FOR DELETE TO anon, authenticated USING (true);

-- Career Submissions
ALTER TABLE IF EXISTS public.career_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_career_submissions ON public.career_submissions;
DROP POLICY IF EXISTS anon_insert_career_submissions ON public.career_submissions;
DROP POLICY IF EXISTS public_select_career_submissions ON public.career_submissions;
DROP POLICY IF EXISTS public_insert_career_submissions ON public.career_submissions;
DROP POLICY IF EXISTS public_update_career_submissions ON public.career_submissions;
DROP POLICY IF EXISTS public_delete_career_submissions ON public.career_submissions;
CREATE POLICY public_select_career_submissions ON public.career_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_career_submissions ON public.career_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_career_submissions ON public.career_submissions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_career_submissions ON public.career_submissions FOR DELETE TO anon, authenticated USING (true);

-- Career Contact Submissions
ALTER TABLE IF EXISTS public.career_contact_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_career_contact_submissions ON public.career_contact_submissions;
DROP POLICY IF EXISTS anon_insert_career_contact_submissions ON public.career_contact_submissions;
DROP POLICY IF EXISTS public_select_career_contact_submissions ON public.career_contact_submissions;
DROP POLICY IF EXISTS public_insert_career_contact_submissions ON public.career_contact_submissions;
DROP POLICY IF EXISTS public_update_career_contact_submissions ON public.career_contact_submissions;
DROP POLICY IF EXISTS public_delete_career_contact_submissions ON public.career_contact_submissions;
CREATE POLICY public_select_career_contact_submissions ON public.career_contact_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_career_contact_submissions ON public.career_contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_career_contact_submissions ON public.career_contact_submissions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_career_contact_submissions ON public.career_contact_submissions FOR DELETE TO anon, authenticated USING (true);

-- Mock Exam Submissions
ALTER TABLE IF EXISTS public.mock_exam_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_mock_exam_submissions ON public.mock_exam_submissions;
DROP POLICY IF EXISTS anon_insert_mock_exam_submissions ON public.mock_exam_submissions;
DROP POLICY IF EXISTS public_select_mock_exam_submissions ON public.mock_exam_submissions;
DROP POLICY IF EXISTS public_insert_mock_exam_submissions ON public.mock_exam_submissions;
DROP POLICY IF EXISTS public_update_mock_exam_submissions ON public.mock_exam_submissions;
DROP POLICY IF EXISTS public_delete_mock_exam_submissions ON public.mock_exam_submissions;
CREATE POLICY public_select_mock_exam_submissions ON public.mock_exam_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_mock_exam_submissions ON public.mock_exam_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_mock_exam_submissions ON public.mock_exam_submissions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_mock_exam_submissions ON public.mock_exam_submissions FOR DELETE TO anon, authenticated USING (true);

-- Custom Mock Exam Submissions
ALTER TABLE IF EXISTS public.custom_mock_exam_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_custom_mock_exam_submissions ON public.custom_mock_exam_submissions;
DROP POLICY IF EXISTS anon_insert_custom_mock_exam_submissions ON public.custom_mock_exam_submissions;
DROP POLICY IF EXISTS public_select_custom_mock_exam_submissions ON public.custom_mock_exam_submissions;
DROP POLICY IF EXISTS public_insert_custom_mock_exam_submissions ON public.custom_mock_exam_submissions;
DROP POLICY IF EXISTS public_update_custom_mock_exam_submissions ON public.custom_mock_exam_submissions;
DROP POLICY IF EXISTS public_delete_custom_mock_exam_submissions ON public.custom_mock_exam_submissions;
CREATE POLICY public_select_custom_mock_exam_submissions ON public.custom_mock_exam_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_custom_mock_exam_submissions ON public.custom_mock_exam_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_custom_mock_exam_submissions ON public.custom_mock_exam_submissions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_custom_mock_exam_submissions ON public.custom_mock_exam_submissions FOR DELETE TO anon, authenticated USING (true);

-- Custom Mock Exam Registrations
ALTER TABLE IF EXISTS public.custom_mock_exam_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_custom_mock_exam_registrations ON public.custom_mock_exam_registrations;
DROP POLICY IF EXISTS anon_insert_custom_mock_exam_registrations ON public.custom_mock_exam_registrations;
DROP POLICY IF EXISTS public_select_custom_mock_exam_registrations ON public.custom_mock_exam_registrations;
DROP POLICY IF EXISTS public_insert_custom_mock_exam_registrations ON public.custom_mock_exam_registrations;
DROP POLICY IF EXISTS public_update_custom_mock_exam_registrations ON public.custom_mock_exam_registrations;
DROP POLICY IF EXISTS public_delete_custom_mock_exam_registrations ON public.custom_mock_exam_registrations;
CREATE POLICY public_select_custom_mock_exam_registrations ON public.custom_mock_exam_registrations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_custom_mock_exam_registrations ON public.custom_mock_exam_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_custom_mock_exam_registrations ON public.custom_mock_exam_registrations FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_custom_mock_exam_registrations ON public.custom_mock_exam_registrations FOR DELETE TO anon, authenticated USING (true);

-- Brochure Downloads
ALTER TABLE IF EXISTS public.brochure_downloads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_brochure_downloads ON public.brochure_downloads;
DROP POLICY IF EXISTS anon_insert_brochure_downloads ON public.brochure_downloads;
DROP POLICY IF EXISTS public_select_brochure_downloads ON public.brochure_downloads;
DROP POLICY IF EXISTS public_insert_brochure_downloads ON public.brochure_downloads;
DROP POLICY IF EXISTS public_update_brochure_downloads ON public.brochure_downloads;
DROP POLICY IF EXISTS public_delete_brochure_downloads ON public.brochure_downloads;
CREATE POLICY public_select_brochure_downloads ON public.brochure_downloads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_brochure_downloads ON public.brochure_downloads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_brochure_downloads ON public.brochure_downloads FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_brochure_downloads ON public.brochure_downloads FOR DELETE TO anon, authenticated USING (true);

-- Banking Enquiries
ALTER TABLE IF EXISTS public.banking_enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_banking_enquiries ON public.banking_enquiries;
DROP POLICY IF EXISTS anon_insert_banking_enquiries ON public.banking_enquiries;
DROP POLICY IF EXISTS public_select_banking_enquiries ON public.banking_enquiries;
DROP POLICY IF EXISTS public_insert_banking_enquiries ON public.banking_enquiries;
DROP POLICY IF EXISTS public_update_banking_enquiries ON public.banking_enquiries;
DROP POLICY IF EXISTS public_delete_banking_enquiries ON public.banking_enquiries;
CREATE POLICY public_select_banking_enquiries ON public.banking_enquiries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_banking_enquiries ON public.banking_enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_banking_enquiries ON public.banking_enquiries FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_banking_enquiries ON public.banking_enquiries FOR DELETE TO anon, authenticated USING (true);

-- Course Enquiries
ALTER TABLE IF EXISTS public.course_enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_course_enquiries ON public.course_enquiries;
DROP POLICY IF EXISTS anon_insert_course_enquiries ON public.course_enquiries;
DROP POLICY IF EXISTS public_select_course_enquiries ON public.course_enquiries;
DROP POLICY IF EXISTS public_insert_course_enquiries ON public.course_enquiries;
DROP POLICY IF EXISTS public_update_course_enquiries ON public.course_enquiries;
DROP POLICY IF EXISTS public_delete_course_enquiries ON public.course_enquiries;
CREATE POLICY public_select_course_enquiries ON public.course_enquiries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_course_enquiries ON public.course_enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_course_enquiries ON public.course_enquiries FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_course_enquiries ON public.course_enquiries FOR DELETE TO anon, authenticated USING (true);

-- Upcoming Class Registrations
ALTER TABLE IF EXISTS public.upcoming_class_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_upcoming_class_registrations ON public.upcoming_class_registrations;
DROP POLICY IF EXISTS anon_insert_upcoming_class_registrations ON public.upcoming_class_registrations;
DROP POLICY IF EXISTS public_select_upcoming_class_registrations ON public.upcoming_class_registrations;
DROP POLICY IF EXISTS public_insert_upcoming_class_registrations ON public.upcoming_class_registrations;
DROP POLICY IF EXISTS public_update_upcoming_class_registrations ON public.upcoming_class_registrations;
DROP POLICY IF EXISTS public_delete_upcoming_class_registrations ON public.upcoming_class_registrations;
CREATE POLICY public_select_upcoming_class_registrations ON public.upcoming_class_registrations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_upcoming_class_registrations ON public.upcoming_class_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_upcoming_class_registrations ON public.upcoming_class_registrations FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_upcoming_class_registrations ON public.upcoming_class_registrations FOR DELETE TO anon, authenticated USING (true);

-- Upcoming Course Interests
ALTER TABLE IF EXISTS public.upcoming_course_interests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_upcoming_course_interests ON public.upcoming_course_interests;
DROP POLICY IF EXISTS anon_insert_upcoming_course_interests ON public.upcoming_course_interests;
DROP POLICY IF EXISTS public_select_upcoming_course_interests ON public.upcoming_course_interests;
DROP POLICY IF EXISTS public_insert_upcoming_course_interests ON public.upcoming_course_interests;
DROP POLICY IF EXISTS public_update_upcoming_course_interests ON public.upcoming_course_interests;
DROP POLICY IF EXISTS public_delete_upcoming_course_interests ON public.upcoming_course_interests;
CREATE POLICY public_select_upcoming_course_interests ON public.upcoming_course_interests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_upcoming_course_interests ON public.upcoming_course_interests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_upcoming_course_interests ON public.upcoming_course_interests FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_upcoming_course_interests ON public.upcoming_course_interests FOR DELETE TO anon, authenticated USING (true);

-- Newsletter Subscribers
ALTER TABLE IF EXISTS public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_select_newsletter_subscribers ON public.newsletter_subscribers;
DROP POLICY IF EXISTS anon_insert_newsletter_subscribers ON public.newsletter_subscribers;
DROP POLICY IF EXISTS public_select_newsletter_subscribers ON public.newsletter_subscribers;
DROP POLICY IF EXISTS public_insert_newsletter_subscribers ON public.newsletter_subscribers;
DROP POLICY IF EXISTS public_update_newsletter_subscribers ON public.newsletter_subscribers;
DROP POLICY IF EXISTS public_delete_newsletter_subscribers ON public.newsletter_subscribers;
CREATE POLICY public_select_newsletter_subscribers ON public.newsletter_subscribers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_newsletter_subscribers ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_newsletter_subscribers ON public.newsletter_subscribers FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_newsletter_subscribers ON public.newsletter_subscribers FOR DELETE TO anon, authenticated USING (true);

-- Conversations & Messages (Chat)
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_conversations ON public.conversations;
DROP POLICY IF EXISTS public_select_conversations ON public.conversations;
DROP POLICY IF EXISTS public_insert_conversations ON public.conversations;
DROP POLICY IF EXISTS public_update_conversations ON public.conversations;
DROP POLICY IF EXISTS public_delete_conversations ON public.conversations;
CREATE POLICY public_select_conversations ON public.conversations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_conversations ON public.conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_conversations ON public.conversations FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_conversations ON public.conversations FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_messages ON public.messages;
DROP POLICY IF EXISTS public_select_messages ON public.messages;
DROP POLICY IF EXISTS public_insert_messages ON public.messages;
DROP POLICY IF EXISTS public_update_messages ON public.messages;
DROP POLICY IF EXISTS public_delete_messages ON public.messages;
CREATE POLICY public_select_messages ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY public_insert_messages ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY public_update_messages ON public.messages FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY public_delete_messages ON public.messages FOR DELETE TO anon, authenticated USING (true);
