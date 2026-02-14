import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req: NextRequest) {
    try {
        const { question, animeTitle, episodeTitle, context } = await req.json();

        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key not configured' },
                { status: 500 }
            );
        }

        if (!question) {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Use Gemini 2.5 Flash (web search not yet supported in SDK types)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
        });

        // Build context-aware prompt
        const systemPrompt = `You are an expert anime assistant helping readers understand the story they're reading.

Context:
- Anime: ${animeTitle}
- Episode: ${episodeTitle || 'Unknown'}
${context ? `- Recent content: ${context.slice(0, 500)}...` : ''}

Instructions:
- Answer questions about characters, techniques, abilities, storylines, and concepts
- Use web search to find accurate, up-to-date information when needed
- Be concise but informative (2-3 paragraphs max)
- If referencing spoilers, warn the user first
- Stay focused on the anime/episode context
- If you don't know something, admit it rather than making it up

User question: ${question}`;

        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const answer = response.text();

        // Extract grounding metadata if available
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

        return NextResponse.json({
            answer,
            metadata: groundingMetadata
                ? {
                    webSearchQueries: groundingMetadata.webSearchQueries || [],
                    groundingSupports: groundingMetadata.groundingSupports?.length || 0,
                }
                : null,
        });
    } catch (error: any) {
        console.error('Chat API error:', error);
        console.error('Error details:', error?.message, error?.stack);
        return NextResponse.json(
            { error: `Failed to get response from AI assistant: ${error?.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
