
-- Enable real-time for companies table
ALTER TABLE public.companies REPLICA IDENTITY FULL;

-- Add companies table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;

-- Enable real-time for deals table as well since they're related
ALTER TABLE public.deals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
