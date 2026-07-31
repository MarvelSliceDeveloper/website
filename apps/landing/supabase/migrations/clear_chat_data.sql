-- Clear all existing chat conversations and messages
-- Run this to delete existing test data
delete from messages;
delete from conversations;

-- After this, the 7-day auto-cleanup will handle future data
-- The delete_old_chat_sessions() function is already created in chat_session_fields.sql
