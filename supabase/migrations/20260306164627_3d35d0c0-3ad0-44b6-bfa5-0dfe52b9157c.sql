
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- User roles RLS
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Drop old tables and recreate with proper schema
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.workshops CASCADE;

-- Recreate workshops table
CREATE TABLE public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES auth.users(id),
  start_date DATE NOT NULL,
  end_date DATE,
  category TEXT NOT NULL DEFAULT 'general',
  total_sessions INTEGER NOT NULL DEFAULT 1,
  max_participants INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view workshops" ON public.workshops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage workshops" ON public.workshops FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers can update assigned workshops" ON public.workshops FOR UPDATE TO authenticated USING (trainer_id = auth.uid());

-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, workshop_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can enroll themselves" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers can view workshop enrollments" ON public.enrollments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.workshops w WHERE w.id = workshop_id AND w.trainer_id = auth.uid())
);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  session_number INTEGER NOT NULL DEFAULT 1,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sessions" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sessions" ON public.sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers can manage assigned workshop sessions" ON public.sessions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.workshops w WHERE w.id = workshop_id AND w.trainer_id = auth.uid())
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent')),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers can manage attendance for their workshops" ON public.attendance FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.workshops w ON w.id = s.workshop_id
    WHERE s.id = session_id AND w.trainer_id = auth.uid()
  )
);

-- Certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, workshop_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own certificates" ON public.certificates FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, workshop_id)
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own feedback" ON public.feedback FOR ALL TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers can view feedback for their workshops" ON public.feedback FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.workshops w WHERE w.id = workshop_id AND w.trainer_id = auth.uid())
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
