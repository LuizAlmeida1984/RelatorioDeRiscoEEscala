# Backend — Laravel 11 + PostgreSQL

API REST para o **Relatório de Risco e Escala | Mentoria Ascensão**.

## Pré-requisitos

- PHP 8.2+
- Composer
- PostgreSQL 15+
- Extensão `pdo_pgsql` habilitada no PHP

## Setup

### 1. Criar o projeto Laravel e sobrescrever com estes arquivos

```bash
composer create-project laravel/laravel . --prefer-dist
```

> Copie os arquivos deste repositório por cima da estrutura gerada.

### 2. Instalar dependências

```bash
composer install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
php artisan key:generate
```

Edite o `.env` com suas credenciais:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=roi_payback
DB_USERNAME=postgres
DB_PASSWORD=sua_senha

GEMINI_API_KEY=sua_chave_gemini
FRONTEND_URL=http://localhost:4200
```

### 4. Criar o banco de dados e rodar as migrations

```bash
# Criar o banco no PostgreSQL
psql -U postgres -c "CREATE DATABASE roi_payback;"

# Rodar as migrations
php artisan migrate
```

### 5. Iniciar o servidor

```bash
php artisan serve
```

A API estará disponível em `http://localhost:8000`.

---

## Endpoints

| Método | Rota              | Descrição                        |
|--------|-------------------|----------------------------------|
| POST   | `/api/analyze`    | Gera análise via Gemini IA       |
| GET    | `/api/reports`    | Lista relatórios salvos          |
| POST   | `/api/reports`    | Salva um relatório               |
| GET    | `/api/reports/{id}` | Retorna um relatório específico |

### Body — `POST /api/analyze`

```json
{
  "mentee_name": "Maria Silva",
  "investment": 10000,
  "monthly_return": 2500,
  "success_prob": 80,
  "risk_factors": {
    "market": 2,
    "team": 1,
    "technical": 3,
    "external": 2
  },
  "stats": {
    "payback": "4.0",
    "annual_roi": "200"
  }
}
```

### Body — `POST /api/reports`

Mesmo formato acima, com campos adicionais:

```json
{
  "stats": {
    "payback": "4.0",
    "annualROI": "200",
    "expectedValue": 22000,
    "riskLevel": "Moderado",
    "factorAvg": 2
  },
  "ai_analysis": "Texto gerado pela IA..."
}
```

---

## Estrutura de Arquivos (somente os criados)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AnalysisController.php   ← Proxy Gemini + validação
│   │   │   └── ReportController.php     ← CRUD de relatórios
│   │   └── Requests/
│   │       └── StoreReportRequest.php   ← Validação do report
│   └── Models/
│       └── RiskReport.php               ← Model Eloquent
├── bootstrap/app.php                    ← Config Laravel 11
├── config/
│   ├── cors.php                         ← CORS para o frontend Angular
│   └── services.php                     ← Chave Gemini API
├── database/migrations/
│   └── ..._create_risk_reports_table.php
├── routes/api.php
├── .env.example
└── composer.json
```
