import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callGeminiWithRotation } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Format history for Gemini
    const formattedHistory = history.map((msg: any) => 
      `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`
    ).join('\n');

    const prompt = `
      Conversation History:
      ${formattedHistory}
      
      Student: ${message}
    `;

    const systemInstruction = `
      You are an expert, friendly AI tutor for Bangladeshi students.
      Explain concepts clearly, using simple English or Banglish if helpful.
      If the student asks a question related to their studies, provide a step-by-step breakdown.
      Keep responses concise and encouraging.
    `;

    const resultText = await callGeminiWithRotation(prompt, systemInstruction);

    // Save to database
    await supabase.from('ai_chat_messages').insert([
      {
        user_id: user.id,
        role: 'user',
        content: message,
        session_date: new Date().toISOString().split('T')[0]
      },
      {
        user_id: user.id, 
        role: 'assistant',
        content: resultText,
        session_date: new Date().toISOString().split('T')[0]
      }
    ]);

    return NextResponse.json({ reply: resultText });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
