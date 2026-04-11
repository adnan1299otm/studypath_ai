import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callGeminiWithRotation } from '@/lib/gemini';
import { Type } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { roadmapId, dayNumber } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify PRO plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();
    if (profile?.plan !== 'pro') {
      return NextResponse.json({ error: 'PRO required' }, { status: 403 });
    }

    // Get topics for last 5 days (dayNumber-4 to dayNumber)
    const { data: roadmap } = await supabase
      .from('roadmaps')
      .select('schedule')
      .eq('id', roadmapId)
      .eq('user_id', user.id)
      .single();
    if (!roadmap) return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });

    const startDay = Math.max(1, dayNumber - 4);
    const allTopicIds: string[] = [];

    for (let d = startDay; d <= dayNumber; d++) {
      const daySchedule = (roadmap.schedule as any[]).find(
        (s: any) => s.day_number === d || s.day === d
      );
      const ids = daySchedule?.topic_ids || daySchedule?.topics || [];
      allTopicIds.push(...ids);
    }

    let topicNames = 'recent study topics';
    if (allTopicIds.length > 0) {
      const { data: topics } = await supabase
        .from('topics')
        .select('name')
        .in('id', allTopicIds);
      if (topics) topicNames = topics.map((t: any) => t.name).join(', ');
    }

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: 'The MCQ question in simple English or Banglish' },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 4 answer options'
          },
          correct: {
            type: Type.INTEGER,
            description: '0-indexed correct option number (0, 1, 2, or 3)'
          },
          explanation: {
            type: Type.STRING,
            description: 'Brief explanation of why the answer is correct (1-2 sentences)'
          }
        },
        required: ['question', 'options', 'correct', 'explanation']
      }
    };

    const prompt = `Generate exactly 10 multiple choice questions (MCQ) based on these topics: ${topicNames}.
Each question must have exactly 4 options.
Mix easy, medium and hard difficulty levels.
Write questions in simple English or Banglish.
Each question must include a brief explanation of the correct answer.
Return exactly 10 questions — no more, no less.`;

    const result = await callGeminiWithRotation(
      prompt,
      'You are an expert teacher creating MCQ questions for Bangladeshi students. Be precise and educational.',
      schema
    );

    const questions = JSON.parse(result || '[]');
    return NextResponse.json({ questions: questions.slice(0, 10) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
