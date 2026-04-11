import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callGeminiWithRotation } from '@/lib/gemini';
import { Type } from '@google/genai';

// POST — generate questions for a day
export async function POST(req: Request) {
  try {
    const { roadmapId, dayNumber } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify PRO plan
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
    if (profile?.plan !== 'pro') return NextResponse.json({ error: 'PRO required' }, { status: 403 });

    // Get topics for this day
    const { data: roadmap } = await supabase.from('roadmaps').select('schedule').eq('id', roadmapId).eq('user_id', user.id).single();
    if (!roadmap) return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });

    const daySchedule = (roadmap.schedule as any[]).find((d: any) => d.day_number === dayNumber || d.day === dayNumber);
    const topicIds = daySchedule?.topic_ids || daySchedule?.topics || [];

    let topicNames = 'today\'s study topics';
    if (topicIds.length > 0) {
      const { data: topics } = await supabase.from('topics').select('name').in('id', topicIds);
      if (topics) topicNames = topics.map((t: any) => t.name).join(', ');
    }

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Must be exactly 'short' or 'long'" },
          question: { type: Type.STRING, description: 'The question text in Bangla or English' },
        },
        required: ['type', 'question']
      }
    };

    const prompt = `Generate 5 assessment questions for these topics: ${topicNames}.
    Mix: 3 short answer questions (1 mark each, 1-2 sentences answer expected) and 2 long answer questions (2 marks each, paragraph answer expected).
    Questions should test understanding, not just memorization. Write in simple English or Banglish.
    Return exactly 5 questions total.`;

    const result = await callGeminiWithRotation(prompt, 'You are an expert teacher creating assessment questions.', schema);
    const questions = JSON.parse(result || '[]');

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT — evaluate answers and save to exam_assessments
export async function PUT(req: Request) {
  try {
    const { roadmapId, dayNumber, questions, answers } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify PRO plan
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
    if (profile?.plan !== 'pro') return NextResponse.json({ error: 'PRO required' }, { status: 403 });

    const evalPrompt = `You are a teacher evaluating student answers. 
    For each question-answer pair, give a score and brief feedback.
    Short questions (type='short'): max 1 mark. Long questions (type='long'): max 2 marks.
    
    Questions and Answers:
    ${questions.map((q: any, i: number) => `Q${i+1} [${q.type}, max ${q.type==='short'?1:2} marks]: ${q.question}\nAnswer: ${answers[i] || '(no answer)'}`).join('\n\n')}`;

    const evalSchema = {
      type: Type.OBJECT,
      properties: {
        scores: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: 'Score for each question' },
        feedback: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Short feedback for each answer' },
        total: { type: Type.NUMBER, description: 'Total score' }
      },
      required: ['scores', 'feedback', 'total']
    };

    const evalResult = await callGeminiWithRotation(evalPrompt, 'You are a fair, encouraging teacher.', evalSchema);
    const result = JSON.parse(evalResult || '{}');

    // Save to exam_assessments
    await supabase.from('exam_assessments').insert({
      user_id: user.id,
      roadmap_id: roadmapId,
      day_number: dayNumber,
      questions: questions,
      user_answers: answers,
      scores: result.scores,
      total_score: result.total,
    });

    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
