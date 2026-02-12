-- Add image_url column to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update RLS policies if necessary (assuming existing policies cover updates)
-- Policies for 'calendar_events' usually allow read for anon and all for authenticated/admin users.
-- Ensuring authenticated users can update the column is implicit if they can update the row.
