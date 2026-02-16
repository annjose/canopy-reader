#!/usr/bin/env bash
# Apply D1 migrations in order.
# Usage:
#   ./scripts/migrate.sh --local    # Apply to local D1 (development)
#   ./scripts/migrate.sh --remote   # Apply to remote D1 (production)

set -euo pipefail

DB_NAME="canopy-db"
MIGRATIONS_DIR="$(cd "$(dirname "$0")/../migrations" && pwd)"

if [[ "${1:-}" == "--remote" ]]; then
  LOCAL_FLAG=""
  echo "Applying migrations to REMOTE D1 database..."
elif [[ "${1:-}" == "--local" ]]; then
  LOCAL_FLAG="--local"
  echo "Applying migrations to LOCAL D1 database..."
else
  echo "Usage: $0 --local | --remote"
  exit 1
fi

for migration in "$MIGRATIONS_DIR"/*.sql; do
  filename=$(basename "$migration")
  echo "  Applying: $filename"
  wrangler d1 execute "$DB_NAME" $LOCAL_FLAG --file="$migration"
done

echo "Done."
