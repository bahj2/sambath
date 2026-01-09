-- Create function to handle new user subscription
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, user_email, plan, status, amount)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    'active',
    0
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic subscription on signup
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();