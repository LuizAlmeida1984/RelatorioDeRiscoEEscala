<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Gemini\Enums\ModelVariation;
use Gemini\GeminiHelper;
use Gemini\Laravel\Facades\Gemini;
use GuzzleHttp\Client;


class AnalysisController extends Controller
{
    
    public function analyzex(Request $request): JsonResponse
    {

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

        $apiKey = "REMOVED"; // ⚠️ NÃO deixe sua chave exposta no código

        $data = [
            "contents" => [
                [
                    "parts" => [
                        [
                            "text" => "Get the distance from moon"
                        ]
                    ]
                ]
            ]
        ];

        $client = new Client();

        $response = $client->post($url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-goog-api-key' => $apiKey,
            ],
            'json' => $data
        ]);

        echo $response->getBody();


    }    

    public function analyze2(Request $request): JsonResponse
    {

        # dd($request); 
        $validated = $request->validate([
            'mentee_name'            => 'required|string|max:255',
            'investment'             => 'required|numeric|min:0',
            'monthly_return'         => 'required|numeric|min:0',
            'success_prob'           => 'required|integer|min:1|max:100',
            'risk_factors'           => 'required|array',
            'risk_factors.market'    => 'required|integer|min:1|max:5',
            'risk_factors.team'      => 'required|integer|min:1|max:5',
            'risk_factors.technical' => 'required|integer|min:1|max:5',
            'risk_factors.external'  => 'required|integer|min:1|max:5',
            'stats'                  => 'required|array',
            'stats.payback'          => 'required',
            'stats.annual_roi'       => 'required',
        ]);

        $rf = $validated['risk_factors'];

        $prompt = <<<PROMPT
Analise o Relatório de Risco e Escala para a empresária {$validated['mentee_name']}.

BASE FINANCEIRA:
- Investimento Total: R\$ {$validated['investment']}
- Retorno Mensal Planejado: R\$ {$validated['monthly_return']}
- Probabilidade de Sucesso: {$validated['success_prob']}%
- Payback: {$validated['stats']['payback']} meses
- ROI Anual: {$validated['stats']['annual_roi']}%

MATRIZ DE RISCO (Escala 1-5):
- Volatilidade de Mercado: {$rf['market']}
- Dependência de capital humano: {$rf['team']}
- Complexidade Técnica: {$rf['technical']}
- Incerteza Externa (BR): {$rf['external']}

Diretrizes de Análise (IA Mentora):
1. Valide se este é um movimento de 'Promoção' (Escala) ou 'Prevenção' (Medo) baseado no cruzamento de ROI e Risco.
2. Interprete os fatores de risco pontuados e sugira uma mitigação para o item com maior pontuação.
3. Use a lógica Lean para sugerir um MVP.
4. Cite um exemplo de liderança brasileira.
5. Dê um veredito: 'Avançar com Audácia', 'Ajustar Premissas' ou 'Abortar Movimento'.

O tom deve ser executivo, sóbrio e altamente estratégico. Use Português de Portugal.
PROMPT;

        $apiKey = config('services.gemini.key');
        $model  = config('services.gemini.model', 'gemini-2.5-flash-preview-09-2025');


        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
        dd($url, $prompt);
        $response = Http::post(
            $url,
            [
                'contents'          => [['parts' => [['text' => $prompt]]]],
                'systemInstruction' => [
                    'parts' => [
                        ['text' => "És a Mentora Digital Ascensão, estrategista de elite em gestão e escala de negócios. O teu foco é proteger o caixa e acelerar o património."],
                    ],
                ],
            ]
        );

        if ($response->failed()) {
            return response()->json(
                ['error' => 'Erro ao contactar a API de inteligência artificial.'],
                502
            );
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (! $text) {
            return response()->json(['error' => 'Resposta inválida da API de IA.'], 502);
        }

        return response()->json(['analysis' => $text]);
    }

    
  public function analyze(Request $request): JsonResponse
    {

        # dd($request); 
        $validated = $request->validate([
            'mentee_name'            => 'required|string|max:255',
            'investment'             => 'required|numeric|min:0',
            'monthly_return'         => 'required|numeric|min:0',
            'success_prob'           => 'required|integer|min:1|max:100',
            'risk_factors'           => 'required|array',
            'risk_factors.market'    => 'required|integer|min:1|max:5',
            'risk_factors.team'      => 'required|integer|min:1|max:5',
            'risk_factors.technical' => 'required|integer|min:1|max:5',
            'risk_factors.external'  => 'required|integer|min:1|max:5',
            'stats'                  => 'required|array',
            'stats.payback'          => 'required',
            'stats.annual_roi'       => 'required',
        ]);

        $rf = $validated['risk_factors'];


$prompt = "
Analise o Relatório de Risco e Escala para a empresária {$validated['mentee_name']}.

BASE FINANCEIRA:
- Investimento Total: R\$ {$validated['investment']}
- Retorno Mensal Planejado: R\$ {$validated['monthly_return']}
- Probabilidade de Sucesso: {$validated['success_prob']}%
- Payback: {$validated['stats']['payback']} meses
- ROI Anual: {$validated['stats']['annual_roi']}%

MATRIZ DE RISCO (Escala 1-5):
- Volatilidade de Mercado: {$rf['market']}
- Dependência de capital humano: {$rf['team']}
- Complexidade Técnica: {$rf['technical']}
- Incerteza Externa (BR): {$rf['external']}

Diretrizes de Análise (IA Mentora):
1. Valide se este é um movimento de 'Promoção' (Escala) ou 'Prevenção' (Medo) baseado no cruzamento de ROI e Risco.
2. Interprete os fatores de risco pontuados e sugira uma mitigação para o item com maior pontuação.
3. Use a lógica Lean para sugerir um MVP.
4. Cite um exemplo de liderança brasileira.
5. Dê um veredito: 'Avançar com Audácia', 'Ajustar Premissas' ou 'Abortar Movimento'.

O tom deve ser executivo, sóbrio e altamente estratégico. Use Português de Portugal.";

#dd($prompt);
        $apiKey = env('GEMINI_API_KEY');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
        $apiKey = env('GEMINI_API_KEY'); 
        $data = [
            "contents" => [
                [
                    "parts" => [
                        [
                            "text" => $prompt
                        ]
                    ]
                ]
            ]
        ];


        $client = new Client();

        $response = $client->post($url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-goog-api-key' => $apiKey,
            ],
            'json' => $data
        ]);

        #echo $response->getBody();

        $data = json_decode($response->getBody(), true);
        #dd($data);
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (! $text) {
            return response()->json(['error' => 'Resposta inválida da API de IA.'], 502);
        }

        return response()->json(['analysis' => $text]);        


    }     

}
