#!/usr/bin/env bash
# Smoke de produccion (DEPLOY-PLAN.md, "Verify & Observe").
# Uso: bash scripts/smoke.sh <PRODUCTION_URL> <SHA>
# Requiere: GH_TOKEN (statuses:read), GITHUB_REPOSITORY, gh, curl y jq.
# Solo hace lecturas: nunca crea reservas. No imprime secretos.
set -euo pipefail

BASE_URL="${1:?Falta PRODUCTION_URL}"
SHA="${2:?Falta el SHA}"
REPO="${GITHUB_REPOSITORY:?Falta GITHUB_REPOSITORY}"
BASE_URL="${BASE_URL%/}"

WAIT_TIMEOUT_SECONDS="${WAIT_TIMEOUT_SECONDS:-900}"
POLL_SECONDS=15

fail() {
  echo "FALLA: $*" >&2
  exit 1
}

# 1. Esperar el commit status de Vercel para ESTE SHA.
#    Sin esta espera, el smoke daria verde contra el deployment anterior.
echo "[1] Esperando el estado de Vercel para ${SHA}"
deadline=$(( $(date +%s) + WAIT_TIMEOUT_SECONDS ))
while :; do
  state=$(gh api "repos/${REPO}/commits/${SHA}/statuses" \
    --jq '[.[] | select(.context | startswith("Vercel"))][0].state // "missing"')
  echo "    estado Vercel: ${state}"
  case "$state" in
    success) break ;;
    failure | error) fail "Vercel reporto '${state}' para ${SHA}. Revisar el log del deployment en Vercel." ;;
  esac
  if [ "$(date +%s)" -ge "$deadline" ]; then
    fail "Vercel no reporto success para ${SHA} en ${WAIT_TIMEOUT_SECONDS}s"
  fi
  sleep "$POLL_SECONDS"
done

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

# Hace un request y deja el cuerpo en $TMP. Imprime el codigo HTTP.
http() {
  curl --silent --show-error --retry 3 --retry-delay 5 --retry-all-errors \
    -o "$TMP" -w '%{http_code}' "$@"
}

expect_status() {
  local label="$1" expected="$2" got="$3"
  if [ "$got" != "$expected" ]; then
    fail "${label}: se esperaba ${expected} y llego ${got}"
  fi
  echo "    OK ${label} -> ${got}"
}

# 2. La app responde.
echo "[2] GET /"
expect_status "GET /" 200 "$(http "${BASE_URL}/")"

# 3. Conexion a Neon por el pooler y semilla cargada.
echo "[3] GET /api/canchas"
expect_status "GET /api/canchas" 200 "$(http "${BASE_URL}/api/canchas")"
cancha_id=$(jq -r '.canchas[0].id // empty' "$TMP")
[ -n "$cancha_id" ] || fail "GET /api/canchas devolvio una lista vacia (falta la semilla?)"
echo "    primera cancha: ${cancha_id}"

# 4. Consulta real y zona horaria.
fecha=$(TZ=America/Lima date +%F)
echo "[4] GET /api/disponibilidad (canchaId=${cancha_id}, fecha=${fecha})"
expect_status "GET /api/disponibilidad" 200 \
  "$(http "${BASE_URL}/api/disponibilidad?canchaId=${cancha_id}&fecha=${fecha}")"

# 5. ADMIN_* cargadas: el formulario de login aparece y la agenda no.
echo "[5] GET /admin"
expect_status "GET /admin" 200 "$(http "${BASE_URL}/admin")"
grep -q 'type="password"' "$TMP" || fail "GET /admin no muestra el campo de contrasena"
if grep -q 'Ver agenda' "$TMP"; then
  fail "GET /admin muestra la agenda sin sesion"
fi
echo "    OK formulario de login presente, agenda oculta"

# 6. Upstash configurado: con una contrasena invalida da 401, no 503 (falla cerrado sin Upstash).
echo "[6] POST /api/admin/login con contrasena invalida"
expect_status "POST /api/admin/login" 401 \
  "$(http -X POST -H 'Content-Type: application/json' \
    --data "{\"password\":\"smoke-invalida-$(date +%s)\"}" \
    "${BASE_URL}/api/admin/login")"

echo "Smoke OK para ${SHA} en ${BASE_URL}"
