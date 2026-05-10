# Frontend — Angular 17 + Tailwind CSS

Interface do **Relatório de Risco e Escala | Mentoria Ascensão**.  
Consome a API Laravel em `http://localhost:8000`.

## Pré-requisitos

- Node.js 18+
- npm 9+

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento

```bash
npm start
```

O frontend estará disponível em `http://localhost:4200`.  
As chamadas para `/api/*` são redirecionadas automaticamente ao backend em `http://localhost:8000` via `proxy.conf.json`.

### 3. Build de produção

```bash
npm run build
```

Os arquivos gerados ficam em `dist/roi-payback-frontend/`.

---

## Estrutura de Arquivos

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── metric-card/          ← Card de métricas (Payback, ROI, Risco)
│   │   │   └── risk-input/           ← Seletor visual de risco (barras 1-5)
│   │   ├── models/
│   │   │   └── report.model.ts       ← Interfaces TypeScript
│   │   ├── services/
│   │   │   └── report.service.ts     ← HttpClient para a API Laravel
│   │   ├── app.component.ts          ← Componente principal (lógica)
│   │   ├── app.component.html        ← Template principal
│   │   └── app.config.ts             ← provideHttpClient, provideZoneChangeDetection
│   ├── environments/
│   │   ├── environment.ts            ← Dev: apiUrl = '/api'
│   │   └── environment.prod.ts       ← Prod: apiUrl = '/api'
│   ├── index.html
│   ├── main.ts
│   └── styles.css                    ← Tailwind + @media print
├── proxy.conf.json                   ← Proxy /api → localhost:8000
├── tailwind.config.js
├── angular.json
├── package.json
└── tsconfig.json
```

---

## Fluxo de Dados

```
Usuário preenche formulário
        ↓
AppComponent.handleAnalyze()
        ↓
ReportService.analyze()  →  POST /api/analyze  →  Laravel AnalysisController
                                                          ↓
                                                    Google Gemini API
                                                          ↓
                                                    Resposta com análise
        ↓
ReportService.saveReport()  →  POST /api/reports  →  Laravel ReportController
                                                              ↓
                                                        PostgreSQL (risk_reports)
```
