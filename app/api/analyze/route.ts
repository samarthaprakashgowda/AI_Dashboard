import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Define the schema so the frontend knows exactly what data shape to expect
const FinancialSchema = z.object({
  totalExpenses: z.number(),
  highestCategory: z.string(),
  overdraftRisk: z.boolean(),
  tips: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

    let extractor: any;

    async function getEmbedding(text: string) {
      if (!extractor) {
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      }

      const result = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data) as number[];
    }

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    // const knowledgeItems = [
    //   "rent → housing",
    //   "food, groceries, dining → food",
    //   "fuel, gas, uber → transport",
    //   "shopping, electronics → discretionary",
    // ];

    // for (const item of knowledgeItems) {
    //   const embedding = await getEmbedding(item);

    //   const { error } = await supabase.from('documents').insert({
    //     content: item,
    //     embedding: Array.from(embedding) // important
    //   });

    //   if (error) {
    //     console.error("Insert error:", error);
    //   } else {
    //     console.log("Inserted:", item);
    //   }
    // }

    const queryEmbedding = await getEmbedding(text);

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 2
    });

    let knowledge = '';

    if (error || !data || data.length === 0) {
      console.warn("Supabase failed, using fallback knowledge");

      knowledge = `
      rent → housing
      food → groceries
      fuel → transport
      shopping → discretionary
      `;
    } else {
      knowledge = data.map((d: any) => d.content).join('\n');
    }

//Coffee 5, snacks 10, lunch 15

    console.log("Supabase data:", data);
    console.log("Supabase error:", error);

    console.log("Knowledge used:", knowledge);

    // Prefer direct Google AI Studio key if available.
    const rawGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const hasGoogleKey = Boolean(rawGoogleKey && rawGoogleKey.trim() !== '' && !rawGoogleKey.startsWith('YOUR_'));
    const rawGatewayKey = process.env.AI_GATEWAY_API_KEY;
    const hasGatewayKey = Boolean(rawGatewayKey && rawGatewayKey.trim() !== '' && !rawGatewayKey.startsWith('YOUR_'));

    if (!hasGoogleKey && !hasGatewayKey) {
      // Basic heuristic: sum any numbers in the text as total expenses.
      const nums = Array.from((text || '').matchAll(/\d+(?:\.\d+)?/g)).map((m) => parseFloat((m as RegExpMatchArray)[0]));
      const total = nums.reduce((a, b) => a + b, 0);

      const categories = {
        rent: 0,
        food: 0,
        transport: 0,
        other: 0
      }; 

      const lower = text.toLowerCase();

      if (lower.includes('rent')) categories.rent += total;
      if (lower.includes('food')) categories.food += total;
      if (lower.includes('fuel') || lower.includes('gas')) {
        categories.transport += total;
      }

      const mock = {
        totalExpenses: Number.isFinite(total) ? total : 0,
        highestCategory: Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0],
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
        prompt: `
          You are a financial assistant.

          Context:${knowledge}

          Rules:
          - totalExpenses = sum of all spending amounts
          - highestCategory = the category with the highest spending (e.g., rent, food, transport, shopping)
          - overdraftRisk = true if totalExpenses is high relative to remaining balance
          - confidence = how sure you are about the extracted data (0 to 1)
          - tips = 2-4 actionable financial suggestions
          -  confidence = how sure you are (0 to 1)

          User log:
          ${text}
          `,
        schema: FinancialSchema,
        schemaDescription: 'Structured financial data'
      });
    } else {
      response = await generateObject({
        model: 'google/gemini-2.5-flash',
        prompt: `
        You are a financial assistant.

        Context:${knowledge}

        Rules:
        - totalExpenses = sum of all spending amounts
        - highestCategory = the category with the highest spending (e.g., rent, food, transport, shopping)
        - overdraftRisk = true if totalExpenses is high relative to remaining balance
        - confidence = how sure you are about the extracted data (0 to 1)
        - tips = 2-4 actionable financial suggestions
        -  confidence = how sure you are (0 to 1)

        User log:
        ${text}
        `,
        schema: FinancialSchema,
        schemaDescription: 'Structured financial data'
      });
    }

    const validated = FinancialSchema.parse(response.object);
    return NextResponse.json(validated);
  } catch (error) {
    return NextResponse.json({
      totalExpenses: 0,
      highestCategory: 'other',
      overdraftRisk: false,
      tips: ['Something went wrong. Please try again.'],
      confidence: 0
    });
  }
}