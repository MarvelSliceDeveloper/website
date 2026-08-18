-- Add batch (Batch 1/2/3/4) to upcoming classes and their registrations
alter table if exists upcoming_classes add column if not exists batch text;

alter table if exists upcoming_class_registrations add column if not exists batch text;
