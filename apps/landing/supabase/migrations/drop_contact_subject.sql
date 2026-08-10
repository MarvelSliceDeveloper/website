-- Remove the now-unused subject column from contact_submissions
alter table contact_submissions drop column if exists subject;
