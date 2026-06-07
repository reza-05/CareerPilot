#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/submission-package"
ZIP_PATH="$ROOT_DIR/CareerPilot-submission.zip"

rm -rf "$OUT_DIR" "$ZIP_PATH"
mkdir -p "$OUT_DIR"

cp "$ROOT_DIR/README.md" "$OUT_DIR/README.md"
cp "$ROOT_DIR/docker-compose.yml" "$OUT_DIR/docker-compose.yml"
cp -R "$ROOT_DIR/docs" "$OUT_DIR/docs"
cp "$ROOT_DIR/careerpilot-backend/requirements.txt" "$OUT_DIR/backend-requirements.txt"
cp "$ROOT_DIR/careerpilot-backend/.env.example" "$OUT_DIR/backend-env-example.txt"
cp "$ROOT_DIR/careerpilot-frontend/package.json" "$OUT_DIR/frontend-package.json"
cp "$ROOT_DIR/careerpilot-frontend/.env.example" "$OUT_DIR/frontend-env-example.txt"

cat > "$OUT_DIR/RUN_COMMANDS.txt" <<'EOF'
Backend:
cd careerpilot-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

Frontend:
cd careerpilot-frontend
npm install
cp .env.example .env.local
npm run dev

Docker:
docker compose up --build
EOF

cd "$ROOT_DIR"
zip -r "$ZIP_PATH" submission-package >/dev/null

echo "Created: $ZIP_PATH"
