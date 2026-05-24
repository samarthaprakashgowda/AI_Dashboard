import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the schema so the frontend knows exactly what data shape to expect
const FinancialSchema = z.object({
  totalExpenses: z.number(),
  highestCategory: z.string(),
  overdraftRisk: z.boolean(),
  tips: z.array(z.string())
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    // Prefer direct Google AI Studio key if available.
    const rawGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const hasGoogleKey = Boolean(rawGoogleKey && rawGoogleKey.trim() !== '' && !rawGoogleKey.startsWith('YOUR_'));
    const rawGatewayKey = process.env.AI_GATEWAY_API_KEY;
    const hasGatewayKey = Boolean(rawGatewayKey && rawGatewayKey.trim() !== '' && !rawGatewayKey.startsWith('YOUR_'));

    if (!hasGoogleKey && !hasGatewayKey) {
      // Basic heuristic: sum any numbers in the text as total expenses.
      const nums = Array.from((text || '').matchAll(/\d+(?:\.\d+)?/g)).map((m) => parseFloat((m as RegExpMatchArray)[0]));
      const total = nums.reduce((a, b) => a + b, 0);

      const mock = {
        totalExpenses: Number.isFinite(total) ? total : 0,
        highestCategory: 'unknown',
        overdraftRisk: total > 1000,
        tips: [
          'Break down recurring payments to reduce surprises.',
          'Track categories for one month to identify savings.'
        ]
      };

      const validated = FinancialSchema.parse(mock);
      return NextResponse.json(validated);
    }

    let response;
    if (hasGoogleKey) {
      response = await generateObject({
        model: google('gemini-2.5-flash'),
        prompt: `Extract structured financial data from this text log: ${text}`,
        schema: FinancialSchema,
        schemaDescription: 'Structured financial data'
      });
    } else {
      response = await generateObject({
        model: 'google/gemini-2.5-flash',
        prompt: `Extract structured financial data from this text log: ${text}`,
        schema: FinancialSchema,
        schemaDescription: 'Structured financial data'
      });
    }

    const validated = FinancialSchema.parse(response.object);
    return NextResponse.json(validated);
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}