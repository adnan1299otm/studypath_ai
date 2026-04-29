import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callGeminiWithRotation } from '@/lib/gemini';
import { Type } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { syllabusId, examDeadline, dailyHours, studentLevel } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: topics } = await supabase
      .from('topics')
      .select('*')
      .eq('syllabus_id', syllabusId)
      .order('display_order');
      
    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'No topics found' }, { status: 400 });
    }
    
    // Calculate total days based on deadline
    const daysUntilExam = Math.max(1, Math.floor((new Date(examDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const prompt = `Create a study schedule for ${daysUntilExam} days, studying ${dailyHours} hours/day. Student Level: ${studentLevel}. 
    Distribute these topics across the days. A day can have multiple topics, or a large topic can span multiple days.
    Topics: ${JSON.stringify(topics.map(t => ({ id: t.id, name: t.name, hours: t.estimated_hours })))}`;
    
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day_number: { type: Type.INTEGER },
          topic_ids: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Array of topic IDs assigned to this day"
          }
        },
        required: ["day_number", "topic_ids"]
      }
    };

    const resultText = await callGeminiWithRotation(
      prompt, 
      "You are an expert study planner. Distribute the workload evenly.", 
      schema
    );
    
    const schedule = JSON.parse(resultText || '[]');

    // Create Roadmap
    const { data: roadmap, error: roadmapError } = await supabase.from('roadmaps').insert({
      user_id: user.id,
      syllabus_id: syllabusId,
      exam_deadline: examDeadline,
      daily_hours: dailyHours,
      student_level: studentLevel,
      total_days: daysUntilExam,
      schedule: schedule,
      is_active: true
    }).select().single();

    if (roadmapError) throw roadmapError;

    // Deactivate other roadmaps
    await supabase.from('roadmaps')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .neq('id', roadmap.id);

<<<<<<< HEAD
    // PRO users get ALL days available from day 1. Free users get only day 1.
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const isPro = userProfile?.plan === 'pro'
    const totalDays = schedule.length

    const dayProgressRows = Array.from({ length: totalDays }, (_, i) => ({
      user_id: user.id,
      roadmap_id: roadmap.id,
      day_number: i + 1,
      status: isPro ? 'available' : (i === 0 ? 'available' : 'locked'),
    }))

    await supabase
      .from('day_progress')
      .upsert(dayProgressRows, { onConflict: 'user_id,roadmap_id,day_number' })
=======
    // Create Day Progress
    const dayProgressToInsert = schedule.map((day: any) => ({
      user_id: user.id,
      roadmap_id: roadmap.id,
      day_number: day.day_number,
      status: day.day_number === 1 ? 'unlocked' : 'locked' // Day 1 always unlocked
    }));

    await supabase.from('day_progress').insert(dayProgressToInsert);
>>>>>>> e778abf694b250563359473f2a170eba7bc0f202

    return NextResponse.json({ success: true, roadmapId: roadmap.id });
  } catch (error: any) {
    console.error('Generate Roadmap Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
