import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, title, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing product with AI:', { imageUrl: imageUrl ? 'provided' : 'none', title, description });

    const messages = [];
    
    // System prompt
    messages.push({
      role: "system",
      content: `Jesteś ekspertem w kategoryzacji produktów e-commerce. 
Analizujesz produkty i zwracasz precyzyjne tagi oraz kategorię.

Zwróć odpowiedź w formacie JSON:
{
  "category": "nazwa kategorii (Electronics, Fashion, Home, Sports, Books, Toys)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedTitle": "lepszy tytuł jeśli obecny jest niejasny",
  "condition": "new lub used - oceń na podstawie opisu",
  "insights": "krótkie wskazówki dla sprzedającego jak ulepszyć ofertę"
}`
    });

    // User message with text and optionally image
    const userContent = [];
    
    if (imageUrl) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageUrl }
      });
    }
    
    userContent.push({
      type: "text",
      text: `Przeanalizuj ten produkt:
Tytuł: ${title || 'Brak tytułu'}
Opis: ${description || 'Brak opisu'}

${imageUrl ? 'Zobacz zdjęcie powyżej.' : 'Brak zdjęcia.'}`
    });

    messages.push({
      role: "user",
      content: userContent
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Przekroczono limit zapytań. Spróbuj ponownie za chwilę.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Brak środków na koncie AI. Dodaj kredyty w ustawieniach.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback response
      result = {
        category: "Electronics",
        tags: ["product", "item"],
        suggestedTitle: title,
        condition: "new",
        insights: "Dodaj więcej szczegółów w opisie produktu."
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-tag-product function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});