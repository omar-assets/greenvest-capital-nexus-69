
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deals;

-- Ensure RLS is enabled on deals table
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create updated RLS policies for deals table
CREATE POLICY "Users can view their own deals" 
  ON public.deals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deals" 
  ON public.deals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals" 
  ON public.deals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals" 
  ON public.deals 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add database indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_updated_at ON public.deals(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_amount ON public.deals(amount_requested);

-- Add soft delete functionality (only if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.deals ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deals_deleted_at ON public.deals(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create audit logging table for tracking changes (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.deal_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'STAGE_CHANGE'
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS to audit log
ALTER TABLE public.deal_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop and recreate audit log policy to ensure it's correct
DROP POLICY IF EXISTS "Users can view their own deal audit logs" ON public.deal_audit_log;
CREATE POLICY "Users can view their own deal audit logs" 
  ON public.deal_audit_log 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_deal_audit_log_deal_id ON public.deal_audit_log(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_audit_log_user_id ON public.deal_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_audit_log_created_at ON public.deal_audit_log(created_at DESC);

-- Create function to log deal changes
CREATE OR REPLACE FUNCTION public.log_deal_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.deal_audit_log (deal_id, user_id, action, new_values)
    VALUES (NEW.id, NEW.user_id, 'CREATE', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.deal_audit_log (deal_id, user_id, action, old_values, new_values)
    VALUES (NEW.id, NEW.user_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.deal_audit_log (deal_id, user_id, action, old_values)
    VALUES (OLD.id, OLD.user_id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS deal_audit_trigger ON public.deals;
CREATE TRIGGER deal_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deal_change();

-- Add database constraints for data integrity (with conditional checks)
DO $$ 
BEGIN
    -- Add constraints only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_amount_positive') THEN
        ALTER TABLE public.deals ADD CONSTRAINT check_amount_positive CHECK (amount_requested > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_stage') THEN
        ALTER TABLE public.deals ADD CONSTRAINT check_valid_stage CHECK (stage IN ('New', 'Reviewing Documents', 'Underwriting', 'Offer Sent', 'Funded', 'Declined'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_email') THEN
        ALTER TABLE public.deals ADD CONSTRAINT check_valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

-- Create function for soft delete
CREATE OR REPLACE FUNCTION public.soft_delete_deal(deal_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.deals 
  SET deleted_at = now() 
  WHERE id = deal_id AND user_id = auth.uid() AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for restoring soft deleted deals
CREATE OR REPLACE FUNCTION public.restore_deal(deal_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.deals 
  SET deleted_at = NULL 
  WHERE id = deal_id AND user_id = auth.uid() AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
