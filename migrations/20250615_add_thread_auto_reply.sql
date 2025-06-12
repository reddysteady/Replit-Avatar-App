-- See CHANGELOG.md for 2025-06-15 [Added]
-- Adds auto_reply column to message_threads
ALTER TABLE message_threads ADD COLUMN IF NOT EXISTS auto_reply boolean DEFAULT false;
