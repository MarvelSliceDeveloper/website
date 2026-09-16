-- Migration: Update Contact Page fields (Phone numbers, Multiple Emails, Working Time)
-- Note: 'nav_pages.sections' is a JSONB column, so no table alteration (DDL) is required.
-- This migration script provides:
-- 1. Documentation of the updated JSON structure for contact_form section content
-- 2. An optional data migration to convert existing legacy fields in nav_pages

/*
  Updated contact_form JSON structure in nav_pages.sections[i].content:
  {
    "left_heading": "Get in Touch",
    "left_heading_line_2": "",
    "left_subtitle": "We'd love to hear from you...",
    "address": "Full address...",
    "phone_competitive": "+91 63809 57390",
    "phone_competitive_heading": "Competitive Exam Enquiry",
    "phone_software": "+91 80882 18609",
    "phone_software_heading": "Software Enquiry",
    "display_phone": "+91 63809 57390 / +91 80882 18609",
    "emails": [
      { "heading": "Software Support", "email": "software@marvelslice.com" },
      { "heading": "General Enquiry", "email": "contact@marvelslice.com" }
    ],
    "email": "contact@marvelslice.com",
    "working_time": "Mon-Fri: 9AM-6PM",
    "business_hours": "Mon-Fri: 9AM-6PM"
  }
*/

-- Optional data migration to populate working_time, phone headings, and emails array from legacy data:
UPDATE nav_pages
SET sections = (
  SELECT jsonb_agg(
    CASE 
      WHEN (elem->>'section_type') = 'contact_form' THEN
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                elem,
                '{content,working_time}',
                COALESCE(elem->'content'->'working_time', elem->'content'->'business_hours', '""'::jsonb)
              ),
              '{content,phone_competitive_heading}',
              COALESCE(elem->'content'->'phone_competitive_heading', '"Competitive Exam Enquiry"'::jsonb)
            ),
            '{content,phone_software_heading}',
            COALESCE(elem->'content'->'phone_software_heading', '"Software Enquiry"'::jsonb)
          ),
          '{content,emails}',
          CASE 
            WHEN elem->'content'->'emails' IS NOT NULL AND jsonb_typeof(elem->'content'->'emails') = 'array' THEN 
              elem->'content'->'emails'
            WHEN elem->'content'->>'email' IS NOT NULL AND elem->'content'->>'email' != '' THEN 
              jsonb_build_array(jsonb_build_object('heading', '', 'email', elem->'content'->>'email'))
            ELSE 
              '[]'::jsonb
          END
        )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(sections) AS elem
)
WHERE sections @> '[{"section_type": "contact_form"}]'::jsonb;
