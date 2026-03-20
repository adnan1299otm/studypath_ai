-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  study_id TEXT UNIQUE NOT NULL,
  institution TEXT,
  subject TEXT,
  avatar_emoji TEXT DEFAULT '🎓',
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  hearts INTEGER DEFAULT 5,
  plan TEXT DEFAULT 'free',
  pro_expires_at TIMESTAMPTZ,
  timer_theme TEXT DEFAULT 'default',
  is_muslim BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. syllabuses
CREATE TABLE public.syllabuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  raw_text TEXT,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. topics
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabuses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  estimated_hours NUMERIC NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. roadmaps
CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  syllabus_id UUID NOT NULL REFERENCES public.syllabuses(id) ON DELETE CASCADE,
  exam_deadline DATE NOT NULL,
  daily_hours NUMERIC NOT NULL,
  student_level TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  schedule JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. day_progress
CREATE TABLE public.day_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  status TEXT DEFAULT 'locked',
  completed_at TIMESTAMPTZ,
  mood TEXT,
  UNIQUE(user_id, roadmap_id, day_number)
);

-- 6. study_sessions
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  duration_secs INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  mood TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 7. friendships
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- 8. nudges
CREATE TABLE public.nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ai_chat_messages
CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  session_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. payment_requests
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  trx_id TEXT,
  screenshot_url TEXT,
  amount NUMERIC NOT NULL,
  plan_months INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 12. subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'pro',
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  payment_method TEXT,
  payment_ref_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. exam_assessments
CREATE TABLE public.exam_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  questions JSONB NOT NULL,
  user_answers JSONB,
  scores JSONB,
  total_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. mcq_results
CREATE TABLE public.mcq_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  day_range TEXT NOT NULL,
  questions JSONB NOT NULL,
  user_answers JSONB,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. user_achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 17. hadiths
CREATE TABLE public.hadiths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  source TEXT NOT NULL,
  narrator TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own syllabuses" ON public.syllabuses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own topics" ON public.topics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own roadmaps" ON public.roadmaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own day_progress" ON public.day_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own study_sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view friendships" ON public.friendships FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update friendships" ON public.friendships FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can view nudges" ON public.nudges FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert nudges" ON public.nudges FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ai_chat_messages" ON public.ai_chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own payment_requests" ON public.payment_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own exam_assessments" ON public.exam_assessments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own mcq_results" ON public.mcq_results FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Users can view own user_achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view hadiths" ON public.hadiths FOR SELECT USING (true);

-- Functions & Triggers

-- 1. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_study_id TEXT;
BEGIN
  new_study_id := 'SP-' || upper(substring(md5(random()::text) from 1 for 6));
  
  INSERT INTO public.profiles (id, full_name, study_id, institution, subject)
  VALUES (
    new.id, 
    COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), 'Student'), 
    new_study_id,
    NULLIF(new.raw_user_meta_data->>'institution', ''),
    NULLIF(new.raw_user_meta_data->>'subject', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. check_and_grant_achievements
CREATE OR REPLACE FUNCTION public.check_and_grant_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_xp INT;
  v_streak INT;
  v_achievement RECORD;
BEGIN
  SELECT xp, streak INTO v_xp, v_streak FROM public.profiles WHERE id = p_user_id;
  
  FOR v_achievement IN SELECT * FROM public.achievements LOOP
    IF v_achievement.title ILIKE '%XP%' AND v_xp >= v_achievement.xp_reward THEN
      INSERT INTO public.user_achievements (user_id, achievement_id) 
      VALUES (p_user_id, v_achievement.id) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. add_xp
CREATE OR REPLACE FUNCTION public.add_xp(p_user_id UUID, p_amount INT)
RETURNS void AS $$
DECLARE
  current_xp INT;
  new_level INT;
BEGIN
  UPDATE public.profiles
  SET xp = xp + p_amount
  WHERE id = p_user_id
  RETURNING xp INTO current_xp;
  
  new_level := floor(current_xp / 200) + 1;
  
  UPDATE public.profiles
  SET level = new_level
  WHERE id = p_user_id;
  
  PERFORM public.check_and_grant_achievements(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. update_streak
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  last_session TIMESTAMPTZ;
  hours_diff NUMERIC;
BEGIN
  SELECT ended_at INTO last_session
  FROM public.study_sessions
  WHERE user_id = p_user_id AND ended_at IS NOT NULL
  ORDER BY ended_at DESC
  LIMIT 1;
  
  IF last_session IS NULL THEN
    UPDATE public.profiles SET streak = 1 WHERE id = p_user_id;
  ELSE
    hours_diff := extract(epoch from (now() - last_session)) / 3600;
    IF hours_diff <= 36 THEN
      UPDATE public.profiles SET streak = streak + 1 WHERE id = p_user_id;
    ELSE
      UPDATE public.profiles SET streak = 1 WHERE id = p_user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. check_pro_status
CREATE OR REPLACE FUNCTION public.check_pro_status(p_user_id UUID)
RETURNS boolean AS $$
DECLARE
  is_pro BOOLEAN;
  exp_date TIMESTAMPTZ;
BEGIN
  SELECT plan, pro_expires_at INTO is_pro, exp_date
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF is_pro AND exp_date < now() THEN
    UPDATE public.profiles SET plan = 'free' WHERE id = p_user_id;
    RETURN false;
  END IF;
  
  RETURN is_pro;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. approve_payment
CREATE OR REPLACE FUNCTION public.approve_payment(p_request_id UUID)
RETURNS void AS $$
DECLARE
  req RECORD;
  new_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO req FROM public.payment_requests WHERE id = p_request_id;
  
  IF req.status = 'approved' THEN
    RETURN;
  END IF;
  
  UPDATE public.payment_requests 
  SET status = 'approved', reviewed_at = now() 
  WHERE id = p_request_id;
  
  new_expires_at := now() + (req.plan_months || ' months')::interval;
  
  INSERT INTO public.subscriptions (user_id, plan, started_at, expires_at, payment_method, payment_ref_id)
  VALUES (req.user_id, 'pro', now(), new_expires_at, req.method, req.trx_id);
  
  UPDATE public.profiles 
  SET plan = 'pro', pro_expires_at = new_expires_at 
  WHERE id = req.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (req.user_id, 'payment_approved', 'Payment Approved!', 'Your PRO subscription is now active.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views

-- 1. v_friends_leaderboard
CREATE OR REPLACE VIEW public.v_friends_leaderboard WITH (security_invoker = on) AS
SELECT 
  p.id,
  p.full_name,
  p.study_id,
  p.institution,
  p.avatar_emoji,
  p.xp,
  p.streak,
  p.plan,
  (p.xp + (p.streak * 45)) as score
FROM public.profiles p;

-- 2. v_daily_ai_images
CREATE OR REPLACE VIEW public.v_daily_ai_images WITH (security_invoker = on) AS
SELECT 
  user_id,
  session_date,
  COUNT(*) as image_count
FROM public.ai_chat_messages
WHERE image_url IS NOT NULL
GROUP BY user_id, session_date;

-- 3. v_active_subscriptions
CREATE OR REPLACE VIEW public.v_active_subscriptions WITH (security_invoker = on) AS
SELECT *
FROM public.subscriptions
WHERE is_active = true AND expires_at > now();

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('syllabuses', 'syllabuses', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-images', 'ai-images', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payments', 'payments', false) ON CONFLICT DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Users can manage their own syllabuses" ON storage.objects FOR ALL USING (bucket_id = 'syllabuses' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage their own ai-images" ON storage.objects FOR ALL USING (bucket_id = 'ai-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage their own payments" ON storage.objects FOR ALL USING (bucket_id = 'payments' AND auth.uid()::text = (storage.foldername(name))[1]);
