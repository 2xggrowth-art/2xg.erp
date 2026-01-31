-- POS Sessions Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.pos_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  session_number VARCHAR(50) NOT NULL UNIQUE,
  register VARCHAR(100) NOT NULL DEFAULT 'billing desk',
  opened_by VARCHAR(255) NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'In-Progress' CHECK (status IN ('In-Progress', 'Closed')),
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(15,2),
  cash_in DECIMAL(15,2) NOT NULL DEFAULT 0,
  cash_out DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON public.pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_opened_at ON public.pos_sessions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_org ON public.pos_sessions(organization_id);

-- Enable RLS
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on pos_sessions" ON public.pos_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.pos_sessions TO authenticated;
GRANT ALL ON public.pos_sessions TO service_role;
