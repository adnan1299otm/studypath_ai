import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGeminiWithRotation } from '@/lib/gemini'
import { Type } from '@google/genai'

export async function POST(req: Request) {
  try {
    const { syllabusId } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!syllabusId) {
      return NextResponse.json({ error: 'syllabusId is required' }, { status: 400 })
    }

    // SECURITY: verify syllabus belongs to this user
    const { data: syllabus } = await supabase
      .from('syllabuses')
      .select('*')
      .eq('id', syllabusId)
      .eq('user_id', user.id)
      .single()

    if (!syllabus) {
      return NextResponse.json({ error: 'Syllabus not found' }, { status: 404 })
    }

    const prompt = `Extract study topics from this syllabus text. Break it down into logical, manageable study sessions.\n\nSyllabus Text:\n${syllabus.raw_text}`

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'The name of the topic' },
          difficulty: { type: Type.STRING, description: "Must be exactly 'easy', 'medium', or 'hard'" },
          estimated_hours: { type: Type.NUMBER, description: 'Estimated hours to study this topic (e.g. 1.5)' }
        },
        required: ['name', 'difficulty', 'estimated_hours']
      }
    }

    const resultText = await callGeminiWithRotation(
      prompt,
      'You are an expert curriculum analyzer. Extract topics accurately and estimate difficulty and time.',
      schema
    )

    const topics = JSON.parse(resultText || '[]')

    const topicsToInsert = topics.map((t: { name: string; difficulty: string; estimated_hours: number }, i: number) => ({
      syllabus_id: syllabusId,
      user_id: user.id,
      name: t.name,
      difficulty: t.difficulty.toLowerCase(),
      estimated_hours: t.estimated_hours,
      display_order: i
    }))

    await supabase.from('topics').insert(topicsToInsert)
    await supabase.from('syllabuses').update({ status: 'processed' }).eq('id', syllabusId).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Extract Topics Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
