-- Add all_day column to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT FALSE;
