#!/usr/bin/env bash
# Applique les migrations sur une base jetable puis lance le test de sécurité RLS.
# Utilisation : PGHOST=... PGPORT=... PGUSER=postgres npm run test:db
set -euo pipefail

DB="uwatch_rls_test_$$"
cd "$(dirname "$0")/.."

psql -qc "create database ${DB}"
trap 'psql -qc "drop database if exists ${DB}" >/dev/null' EXIT

psql -d "$DB" -q -v ON_ERROR_STOP=1 -f supabase/tests/supabase_stub.sql
for migration in supabase/migrations/*.sql; do
  psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$migration"
done
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f supabase/tests/rls_smoke.sql | tail -n 3
