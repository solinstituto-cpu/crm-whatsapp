-- Email tracking + agendamento + automação (incremental)
-- Execute no SQL Editor do Supabase

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS "clickedCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.email_campaign_messages
  ADD COLUMN IF NOT EXISTS "clickCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "firstClickedAt" TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "lastClickedAt" TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "automationProcessedAt" TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS "idx_email_campaign_messages_clickCount"
  ON public.email_campaign_messages ("clickCount");

