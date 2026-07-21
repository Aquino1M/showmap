-- Add updated_at to events for audit trail
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Add value field for financial tracking per event
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS value numeric(12,2) DEFAULT 0;

-- Add recurring_until to limit recurring events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurring_until date;
