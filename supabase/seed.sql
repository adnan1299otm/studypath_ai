-- Default Achievements
INSERT INTO public.achievements (title, emoji, xp_reward) VALUES 
('First Steps', '🌱', 50),
('100 XP Milestone', '⭐', 100),
('500 XP Milestone', '🌟', 500),
('1000 XP Milestone', '🏆', 1000),
('3 Day Streak', '🔥', 100),
('7 Day Streak', '⚡', 300)
ON CONFLICT DO NOTHING;

-- Default Hadiths
INSERT INTO public.hadiths (text, source, narrator) VALUES 
('যে ব্যক্তি জ্ঞান অর্জনের জন্য কোনো পথ অবলম্বন করে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।', 'সহীহ মুসলিম, ২৬৯৯', 'আবু হুরাইরা (রা.)'),
('তোমাদের মধ্যে সর্বোত্তম সে, যে কুরআন শেখে এবং অন্যকে শেখায়।', 'সহীহ বুখারী, ৫০২৭', 'উসমান বিন আফফান (রা.)'),
('যে ব্যক্তি সকাল বেলা ইলম (জ্ঞান) অর্জনের উদ্দেশ্যে বের হয়, সে আল্লাহর পথে (জিহাদে) থাকে, যতক্ষণ না সে ফিরে আসে।', 'সুনান আত-তিরমিযী, ২৬৪৭', 'আনাস বিন মালিক (রা.)')
ON CONFLICT DO NOTHING;
