#!/usr/bin/env bash
#
# Terapkan migration + seed ke Supabase.
#
# Jalankan dari root project (file ini ikut ter-mount ke container DDEV):
#
#   ddev exec bash scripts/db-migrate.sh
#
# Membaca kredensial dari .env (gitignored):
#   DATABASE_URL         postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
#   SUPABASE_DB_REGION   region project, mis. ap-south-1 (hanya dipakai lewat pooler)
#
# Kenapa ada pooler: host `db.<ref>.supabase.co` hanya mengembalikan alamat
# IPv6 (AAAA). Jaringan lokal dan container DDEV rootless tidak selalu punya
# route IPv6 global, sehingga koneksi langsung gagal dengan
# "Network is unreachable". Supavisor punya alamat IPv4, jadi jadi fallback.
#
# Semua statement di supabase/migrations dan supabase/seed.sql bersifat
# idempoten, jadi aman dijalankan berkali-kali.

set -euo pipefail

if [ ! -f .env ]; then
  echo "ERROR: .env tidak ditemukan. Salin .env.example lalu isi kredensialnya." >&2
  exit 1
fi

# shellcheck disable=SC1091
envval() { grep -E "^$1=" .env | head -1 | cut -d= -f2- || true; }

DIRECT_URL="$(envval DATABASE_URL)"
REGION="$(envval SUPABASE_DB_REGION)"
[ -n "$REGION" ] || REGION="ap-south-1"

if [ -z "$DIRECT_URL" ]; then
  echo "ERROR: DATABASE_URL belum diisi di .env" >&2
  exit 1
fi

REF="$(printf '%s' "$DIRECT_URL" | sed -E 's#^postgresql://[^@]*@db\.([a-z0-9]+)\..*#\1#')"
if [ -z "$REF" ]; then
  echo "ERROR: host di DATABASE_URL tidak bisa dibaca, cek formatnya." >&2
  exit 1
fi

export PGPASSWORD="$(printf '%s' "$DIRECT_URL" | sed -E 's#^postgresql://[^:]+:([^@]*)@.*#\1#')"

# Koneksi langsung dulu (lebih benar secara semantik), pooler sebagai cadangan.
CONN="$DIRECT_URL"
TRANSPORT="langsung (IPv6)"
if ! psql "$DIRECT_URL" -tAc 'select 1' >/dev/null 2>&1; then
  POOLER="host=aws-0-${REGION}.pooler.supabase.com port=5432 user=postgres.${REF} dbname=postgres sslmode=require"
  echo "Koneksi langsung gagal (kemungkinan tidak ada route IPv6), mencoba pooler ${REGION}."
  if ! psql "$POOLER" -tAc 'select 1' >/dev/null 2>&1; then
    echo "ERROR: gagal juga lewat pooler. Cek DATABASE_URL, password, dan SUPABASE_DB_REGION." >&2
    exit 1
  fi
  CONN="$POOLER"
  TRANSPORT="pooler ${REGION} (IPv4)"
fi

echo "== koneksi via $TRANSPORT =="
psql "$CONN" -tAc "select 'user ' || current_user || ' | server ' || current_setting('server_version');"

FILES=(
  supabase/migrations/20260930000001_init.sql
  supabase/migrations/20260930000002_hardening.sql
  supabase/migrations/20260930000003_duitku.sql
  supabase/seed.sql
)

for f in "${FILES[@]}"; do
  echo
  echo "== $f =="
  psql "$CONN" -q -v ON_ERROR_STOP=1 -f "$f"
  echo "   OK"
done

echo
echo "== verifikasi =="
psql "$CONN" -tAc "select 'tabel   : ' || count(*) from pg_tables where schemaname = 'public';"
psql "$CONN" -tAc "select 'template: ' || count(*) from public.templates;"
psql "$CONN" -tAc "select 'bucket  : ' || id || ' (public=' || public || ')' from storage.buckets where id = 'wedding-media';"
psql "$CONN" -tAc "select 'payment : ' || pg_get_constraintdef(oid) from pg_constraint where conname = 'payments_provider_check';"
echo
echo "Selesai. Untuk membuat akun admin, daftar lewat /register lalu:"
echo "  update public.profiles set role = 'admin' where id = '<user-uuid>';"
