export interface Profile {
  id: string;
  full_name: string;
  study_id: string;
  institution: string | null;
  subject: string | null;
  avatar_emoji: string | null;
  xp: number;
  streak: number;
  level: number;
  hearts: number;
  plan: 'free' | 'pro';
  pro_expires_at: string | null;
  timer_theme: string | null;
  is_muslim: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Syllabus {
  id: string;
  user_id: string;
  title: string;
  file_url: string | null;
  raw_text: string | null;
  is_active: boolean;
  status: 'pending' | 'processing' | 'done' | 'error';
  created_at: string;
}

export interface Topic {
  id: string;
  syllabus_id: string;
  user_id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_hours: number;
  display_order: number;
  created_at: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  syllabus_id: string;
  exam_deadline: string;
  daily_hours: number;
  student_level: 'beginner' | 'mid' | 'talented';
  total_days: number;
  schedule: any; // JSONB
  is_active: boolean;
  created_at: string;
}

export interface DayProgress {
  id: string;
  user_id: string;
  roadmap_id: string;
  day_number: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  completed_at: string | null;
  mood: 'bad' | 'neutral' | 'good' | 'fire' | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  roadmap_id: string;
  day_number: number;
  topic_id: string | null;
  duration_secs: number;
  xp_earned: number;
  mood: 'bad' | 'neutral' | 'good' | 'fire' | null;
  started_at: string;
  ended_at: string | null;
}

export interface Friendship {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'nudge' | 'payment_approved' | 'payment_rejected' | 'streak_reminder' | 'achievement';
  from_user_id: string | null;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface AIChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url: string | null;
  session_date: string;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  method: 'bkash' | 'nagad' | 'binance';
  trx_id: string | null;
  screenshot_url: string | null;
  amount: number;
  plan_months: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'pro';
  started_at: string;
  expires_at: string;
  payment_method: 'bkash' | 'nagad' | 'binance' | null;
  payment_ref_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ExamAssessment {
  id: string;
  user_id: string;
  roadmap_id: string;
  day_number: number;
  questions: any; // JSONB
  user_answers: any; // JSONB
  scores: any; // JSONB
  total_score: number;
  created_at: string;
}

export interface MCQResult {
  id: string;
  user_id: string;
  roadmap_id: string;
  day_range: string;
  questions: any; // JSONB
  user_answers: any; // JSONB
  score: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  emoji: string;
  xp_reward: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  created_at: string;
}

export interface Hadith {
  id: string;
  text: string;
  source: string;
  narrator: string;
  created_at: string;
}
