-- Fix 1: Force all self-registrations to 'student' regardless of metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email);
  
  -- All self-registered users get 'student' role; admins promote manually
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$function$;

-- Fix 2: Add auth check to get_user_role to prevent role enumeration
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id <> auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1);
END;
$function$;