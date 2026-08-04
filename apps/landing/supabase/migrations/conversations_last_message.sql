-- Add last_message and last_message_sender to conversations table
alter table conversations add column if not exists last_message text default '';
alter table conversations add column if not exists last_message_sender text default '';
alter table conversations add column if not exists notified boolean default false;
