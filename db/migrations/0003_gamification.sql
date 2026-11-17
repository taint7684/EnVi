-- Phase 7: Gamification - Add XP and Level to profiles
-- Run this migration in Supabase SQL Editor

-- Add xp and level columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Create function to calculate level from XP
-- 1000 XP = Level 1, 2000 XP = Level 2, etc.
CREATE OR REPLACE FUNCTION calculate_level(xp_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN FLOOR(xp_amount / 1000.0)::INTEGER + 1;
END;
$$;

-- Create function to add XP and update level
CREATE OR REPLACE FUNCTION add_xp(
  user_uuid UUID,
  xp_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    xp = xp + xp_amount,
    level = calculate_level(xp + xp_amount),
    updated_at = now()
  WHERE id = user_uuid;
END;
$$;

-- Create trigger to auto-update level when xp changes
CREATE OR REPLACE FUNCTION update_level_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.level = calculate_level(NEW.xp);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_update_level ON public.profiles;
CREATE TRIGGER profiles_update_level
  BEFORE UPDATE OF xp ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_level_trigger();

-- Update RLS policies for profiles to allow xp/level updates
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION add_xp(UUID, INTEGER) TO authenticated;