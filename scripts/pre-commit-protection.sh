#!/bin/bash
# Pre-commit hook: Bloquear commits que contengan datos sensibles de cuentas Roblox
# Asegura que .ROBLOSECURITY cookies, tokens, y datos de cuentas NO se commiteen

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Patrones sensibles
PATTERNS=(
  '\.ROBLOSECURITY=[A-Za-z0-9_%]'
  'rbx-authentication-ticket'
  'roblox_player_beta'
  'ticket=[A-Za-z0-9]'
  '_ticket=[A-Za-z0-9]'
  '|Warning|Long|0_[0-9a-f]'
  'WARNING'
  'LONG'
  'STOCKDATABASE'
)

echo "[pre-commit] Checking for sensitive Roblox account data..."

# Archivos a escanear (staged files)
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -v -E '\.(md|json|lock|gitignore)$' | grep -v 'node_modules')

FOUND_SECRETS=0

for file in $FILES; do
  if [ ! -f "$file" ]; then continue; fi
  
  for pattern in "${PATTERNS[@]}"; do
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      echo -e "${RED}[pre-commit] BLOCKED: Sensible data found in $file${NC}"
      echo -e "${RED}  Pattern: $pattern${NC}"
      grep -n "$pattern" "$file" | head -3
      FOUND_SECRETS=1
    fi
  done
done

# Also run gitleaks if available
if command -v gitleaks &> /dev/null; then
  if ! gitleaks protect --staged --no-banner 2>/dev/null; then
    echo -e "${RED}[pre-commit] gitleaks detectó secretos${NC}"
    FOUND_SECRETS=1
  fi
fi

if [ $FOUND_SECRETS -eq 1 ]; then
  echo -e "${RED}[pre-commit] COMMIT BLOQUEADO — eliminar datos sensibles antes de commitear${NC}"
  exit 1
fi

echo -e "${GREEN}[pre-commit] No sensitive data found — safe to commit${NC}"
exit 0
