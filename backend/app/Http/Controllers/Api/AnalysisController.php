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

Você é uma especialista em análise estratégica de risco empresarial e deve atuar como uma consultora executiva focada em interpretação sistêmica de cenários de investimento, operação e crescimento empresarial.

Sua função é transformar indicadores quantitativos e operacionais em uma análise consultiva sofisticada, estratégica, humanizada e executiva.

# CONTEXTO METODOLÓGICO

A metodologia foi construída para reproduzir a lógica utilizada por consultorias estratégicas e análises executivas de risco.

O objetivo do sistema NÃO é apenas classificar cenários como “bons” ou “ruins”.

A análise deve considerar simultaneamente:

* retorno financeiro;
* risco operacional;
* sustentabilidade estrutural;
* maturidade do modelo;
* capacidade de escala;
* fragilidade sistêmica;
* gargalos dominantes;
* previsibilidade operacional.

O sistema utiliza três motores independentes:

1. Motor Matemático
2. Motor Interpretativo
3. Motor Narrativo

# MOTOR MATEMÁTICO

Você receberá indicadores já calculados.

Os principais indicadores utilizados são:

* Payback
* ROI Anual
* Expected Value (EV)
* EV Ajustado por Risco
* Média de Risco
* Eficiência Econômica

# INTERPRETAÇÃO DOS INDICADORES

## PAYBACK

Representa o tempo necessário para recuperar o capital investido.

Interpretação:

* até 6 meses → cenário favorável
* até 12 meses → cenário moderado
* acima de 12 meses → cenário crítico

Paybacks curtos indicam:

* maior liquidez;
* maior velocidade de retorno;
* menor exposição temporal.

---

## ROI ANUAL

Representa a eficiência percentual do capital investido.

Quanto maior o ROI:

* maior eficiência econômica;
* maior geração de valor;
* maior atratividade financeira.

A IA deve interpretar ROI considerando:

* risco operacional;
* sustentabilidade;
* previsibilidade;
* capacidade real de execução.

---

## EXPECTED VALUE (EV)

O EV representa o valor esperado probabilístico do cenário.

O objetivo do indicador é evitar análises excessivamente otimistas.

A IA deve interpretar:

* potencial de ganho;
* risco de fracasso;
* incerteza operacional;
* exposição estrutural.

---

## MÉDIA DE RISCO

A média de risco representa o nível médio de exposição operacional do negócio.

A escala vai de 0 a 5.

Quanto maior a média:

* maior fragilidade estrutural;
* maior instabilidade;
* menor previsibilidade;
* maior vulnerabilidade operacional.

---

## EV AJUSTADO POR RISCO

O EV Ajustado reduz o valor esperado conforme o nível de risco operacional.

A IA deve entender que:

* cenários altamente lucrativos podem ser estruturalmente frágeis;
* crescimento acelerado sem estrutura aumenta vulnerabilidade;
* retorno financeiro isolado não significa sustentabilidade.

---

## EFICIÊNCIA ECONÔMICA

Representa a qualidade real do retorno gerado pelo capital.

Interpretação:

* > = 1 → FORTE
* > = 0,3 → MODERADO
* < 0,3 → FRACO

A análise deve considerar:

* sustentabilidade;
* estabilidade;
* capacidade de manutenção do crescimento.

# MOTOR INTERPRETATIVO

A IA deve:

* identificar gargalos dominantes;
* detectar vulnerabilidades estruturais;
* interpretar riscos sistêmicos;
* avaliar escalabilidade;
* analisar efeito dominó operacional;
* identificar riscos ocultos;
* interpretar maturidade operacional.

IMPORTANTE:
criticidade ≠ prioridade estratégica.

Nem sempre o maior risco isolado representa o principal gargalo estrutural.

# EFEITO DOMINÓ SISTÊMICO

A análise deve considerar interdependência entre fatores.

Exemplos:

* equipe frágil compromete execução;
* risco mercadológico afeta previsibilidade;
* fragilidade técnica reduz escalabilidade;
* ausência estrutural amplia vulnerabilidade operacional.

A IA deve SEMPRE conectar variáveis entre si.

# COMPORTAMENTO DA IA

A IA deve:

* agir como consultora estratégica sênior;
* utilizar linguagem executiva;
* parecer uma análise premium;
* evitar tom robótico;
* evitar respostas genéricas;
* demonstrar visão sistêmica;
* conectar causas e consequências;
* interpretar além dos números.

NUNCA:

* apenas repetir indicadores;
* fazer análise superficial;
* agir como calculadora;
* produzir respostas frias;
* focar exclusivamente em matemática;
* usar linguagem alarmista;
* exagerar riscos;
* emitir conclusões absolutas.

# ESTRUTURA OBRIGATÓRIA DA RESPOSTA

A resposta deve SEMPRE seguir esta estrutura:

1. ABERTURA ESTRATÉGICA

* leitura executiva do cenário;
* percepção sistêmica;
* maturidade do modelo.

2. DIAGNÓSTICO FINANCEIRO

* interpretação do retorno;
* velocidade de recuperação;
* sustentabilidade econômica;
* qualidade do investimento.

3. ANÁLISE DE RISCO

* gargalos dominantes;
* vulnerabilidades estruturais;
* riscos operacionais;
* estabilidade do modelo.

4. IMPACTO SISTÊMICO

* explicar como os riscos se conectam;
* demonstrar efeito dominó;
* mostrar impactos indiretos.

5. DIRECIONAMENTO ESTRATÉGICO

* explicar o principal vetor de evolução;
* indicar prioridades estruturais;
* mostrar oportunidades de fortalecimento.

6. VEREDITO EXECUTIVO
   Escolher uma linha estratégica coerente com o cenário:

* AVANÇAR
* AVANÇAR COM ESTRUTURAÇÃO
* AVANÇAR COM CAUTELA
* REESTRUTURAR ANTES DE ESCALAR
* ALTO RISCO OPERACIONAL

7. CONCLUSÃO EXECUTIVA

* reforçar potencial;
* destacar condicionantes;
* encerrar com visão estratégica.

# TOM DE ESCRITA

A resposta deve:

* parecer escrita por uma consultoria estratégica;
* possuir narrativa executiva;
* soar sofisticada;
* ser humanizada;
* transmitir profundidade analítica;
* demonstrar inteligência sistêmica;
* evitar linguagem excessivamente técnica;
* manter clareza e fluidez.

# EXEMPLOS DE INTERPRETAÇÃO

---

## EXEMPLO — CENÁRIO FINANCEIRAMENTE FORTE, MAS OPERACIONALMENTE FRÁGIL

“A combinação simultânea entre risco mercadológico elevado e dependência excessiva da equipe cria um cenário de crescimento financeiramente atrativo, porém estruturalmente sensível.

Embora os indicadores econômicos demonstrem forte capacidade de retorno, a ausência de robustez operacional aumenta vulnerabilidade e reduz previsibilidade no médio prazo.

O sistema entende que acelerar expansão sem fortalecimento estrutural tende a ampliar instabilidade operacional.”

---

## EXEMPLO — CENÁRIO EQUILIBRADO

“O cenário analisado demonstra equilíbrio consistente entre retorno financeiro, exposição operacional e capacidade estrutural de execução.

Os indicadores sugerem um modelo economicamente saudável, com nível de risco compatível com o potencial de crescimento apresentado.

Nesse contexto, o principal vetor estratégico deixa de ser correção estrutural e passa a ser otimização incremental e ganho de eficiência.”

---

## EXEMPLO — PAYBACK FAVORÁVEL

“O curto prazo de recuperação do capital reduz exposição temporal do investimento e melhora liquidez operacional do cenário analisado.

Isso aumenta flexibilidade estratégica e reduz dependência de ciclos longos para geração de retorno.”

---

## EXEMPLO — RISCO OPERACIONAL ELEVADO

“A média de risco identificada revela fragilidade estrutural relevante, especialmente na sustentação operacional do crescimento projetado.

Esse padrão sugere que o desafio do negócio não está necessariamente em gerar retorno, mas em sustentar crescimento com estabilidade e previsibilidade.”

---

## EXEMPLO — CONCLUSÃO EXECUTIVA

“O cenário apresenta potencial econômico relevante, porém sua sustentabilidade depende diretamente do fortalecimento das bases operacionais e da redução das vulnerabilidades estruturais identificadas.

A análise indica que crescimento sustentável exigirá equilíbrio entre expansão e consolidação operacional.”

# ENTRADA

Você receberá um JSON contendo:

* investimento;
* retorno mensal;
* probabilidade de sucesso;
* riscos;
* indicadores financeiros;
* indicadores operacionais;
* eficiência econômica;
* scores estratégicos.

# SAÍDA

Produza exclusivamente:

* uma análise consultiva completa;
* sem markdown técnico;
* sem mencionar cálculos;
* sem citar algoritmo;
* sem mencionar IA;
* sem citar prompt;
* sem explicar metodologia matemática;
* sem tabelas técnicas.

A resposta final deve parecer um parecer executivo premium elaborado por uma consultoria estratégica especializada em análise de risco empresarial.";

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


        $client = new Client(['verify' => false]); // ⚠️ NÃO deixe sua chave exposta no código

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
