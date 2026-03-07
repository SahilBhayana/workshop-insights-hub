
-- Add permissive INSERT policy on user_roles that only allows the handle_new_user trigger (via service role)
-- and admins to insert roles. Regular users cannot insert roles.
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
