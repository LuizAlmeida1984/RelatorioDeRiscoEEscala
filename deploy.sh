#!/bin/bash
# ============================================================
# deploy.sh — Script de deploy para VPS (http://2.24.198.67:81)
# Uso: bash deploy.sh [--skip-build]
# ============================================================
set -e

REPO_DIR="/opt/roiescala"
SKIP_BUILD=false

for arg in "$@"; do
  [[ "$arg" == "--skip-build" ]] && SKIP_BUILD=true
done

echo "========================================"
echo " ROI Escala — Deploy"
echo "========================================"

# ── 1. Clonar ou atualizar o repositório ────────────────────
if [ -d "$REPO_DIR/.git" ]; then
  echo "[1/7] Atualizando repositório..."
  cd "$REPO_DIR"
  git fetch --all
  git reset --hard origin/master
  git pull origin master
else
  echo "[1/7] Clonando repositório..."
  git clone https://github.com/LuizAlmeida1984/c--RelatorioDeRiscoEEscala-ROI.git "$REPO_DIR" 2>/dev/null || {
    echo "ERRO: Repositório não encontrado. Crie manualmente o diretório $REPO_DIR com os arquivos do projeto."
    exit 1
  }
  cd "$REPO_DIR"
fi

# ── 2. Configurar .env do backend ───────────────────────────
echo "[2/7] Configurando .env do backend..."
if [ ! -f "$REPO_DIR/backend/.env" ]; then
  if [ -f "$REPO_DIR/backend/.env.production" ]; then
    cp "$REPO_DIR/backend/.env.production" "$REPO_DIR/backend/.env"
    echo "  → .env copiado de .env.production"
  else
    echo "  ATENÇÃO: Nenhum .env encontrado."
    echo "  Crie o arquivo $REPO_DIR/backend/.env com as variáveis de produção."
    echo "  Exemplo mínimo:"
    cat <<'ENV'
APP_NAME="ROI Payback API"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://2.24.198.67:81
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=roi_payback
DB_USERNAME=postgres
DB_PASSWORD=desenv
GEMINI_API_KEY=SUA_CHAVE_AQUI
GEMINI_MODEL=gemini-2.0-flash
FRONTEND_URL=http://2.24.198.67:81
ENV
    exit 1
  fi
fi

# ── 3. Instalar Node.js se necessário ──────────────────────
if [ "$SKIP_BUILD" = false ]; then
  if ! command -v node &>/dev/null; then
    echo "[3/7] Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  else
    echo "[3/7] Node.js já instalado: $(node -v)"
  fi

  # ── 4. Build do frontend Angular ──────────────────────────
  echo "[4/7] Construindo frontend Angular..."
  cd "$REPO_DIR/frontend"
  npm install --legacy-peer-deps --silent
  npx ng build --configuration production
  echo "  → Build concluído: frontend/dist/roi-payback-frontend/browser/"
  cd "$REPO_DIR"
else
  echo "[3/7] Node.js — ignorado (--skip-build)"
  echo "[4/7] Build Angular — ignorado (--skip-build)"
fi

# ── 5. Subir containers Docker ──────────────────────────────
echo "[5/7] Iniciando containers Docker..."
cd "$REPO_DIR"
docker compose down --remove-orphans 2>/dev/null || docker-compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build 2>/dev/null || docker-compose up -d --build

# ── 6. Configurar backend Laravel ──────────────────────────
echo "[6/7] Configurando backend Laravel..."
sleep 8  # aguarda PHP-FPM iniciar

DOCKER_COMPOSE_CMD="docker compose"
command -v "docker compose" &>/dev/null || DOCKER_COMPOSE_CMD="docker-compose"

$DOCKER_COMPOSE_CMD exec -T app composer install --no-dev --optimize-autoloader
$DOCKER_COMPOSE_CMD exec -T app php artisan key:generate --force
$DOCKER_COMPOSE_CMD exec -T app php artisan config:cache
$DOCKER_COMPOSE_CMD exec -T app php artisan route:cache
$DOCKER_COMPOSE_CMD exec -T app php artisan migrate --force

# ── 7. Verificar serviços ───────────────────────────────────
echo "[7/7] Verificando containers..."
$DOCKER_COMPOSE_CMD ps

echo ""
echo "========================================"
echo " ✅ Deploy concluído!"
echo "    Acesse: http://2.24.198.67:81"
echo "========================================"
