-- Migration: Add referrer and country to analytics
ALTER TABLE public.analytics_logs ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.analytics_logs ADD COLUMN IF NOT EXISTS country TEXT;
