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
    const { messages, userType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Chat assistant request:', { messageCount: messages.length, userType });

    // Different system prompts based on user type
    const systemPrompts = {
      buyer: `Jesteś pomocnym asystentem zakupowym na platformie MarketHub.
Pomagasz kupującym w:
- Znalezieniu odpowiednich produktów
- Zrozumieniu różnic między ofertami
- Negocjacji cen
- Pytaniach o dostawę i zwroty
- Weryfikacji wiarygodności sprzedawców

Odpowiadaj po polsku, zwięźle i pomocnie.`,
      
      seller: `Jesteś ekspertem od sprzedaży na platformie MarketHub.
Pomagasz sprzedającym w:
- Optymalizacji opisów produktów
- Ustalaniu konkurencyjnych cen
- Tworzeniu atrakcyjnych ofert
- Zwiększaniu widoczności produktów
- Analizie trendów rynkowych

Odpowiadaj po polsku, profesjonalnie i praktycznie.`,
      
      general: `Jesteś asystentem handlowym na platformie MarketHub.
Pomagasz użytkownikom w zakupach i sprzedaży.
Odpowiadaj po polsku, pomocnie i profesjonalnie.`
    };

    const systemPrompt = systemPrompts[userType as keyof typeof systemPrompts] || systemPrompts.general;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.8,
        stream: true,
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

    // Return the streaming response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});