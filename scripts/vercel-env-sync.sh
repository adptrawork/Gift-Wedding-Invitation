#!/usr/bin/env bash
# Dorong variabel dari .env ke environment Vercel.
#
# Dipakai setelah .env berubah (mis. NEXT_PUBLIC_BASE_URL dapat domain
# produksi) supaya Vercel tidak memakai nilai lama yang sudah tertanam saat
# build sebelumnya.
#
# Kenapa tidak lewat REST API: endpoint hapus di v9 tidak bekerja —
# `DELETE /env/{key}?target=` tidak menghapus apa pun, sehingga POST sesudahnya
# tetap dibalas ENV_ALREADY_EXISTS meski `?upsert=true` dipakai. `vercel env
# rm` lalu `vercel env add` berhasil, dan nilainya dikirim lewat stdin supaya
# tidak muncul di log.
#
# Catatan penting:
#  - CLI hanya menerima SATU environment per pemanggilan; "production preview"
#    ditolak. Karena itu tiap target dipanggil terpisah.
#  - `NEXT_PUBLIC_*` tidak boleh memakai --sensitive: nilainya memang dikirim ke
#    browser, dan Vercel menolak combination itu.
#  - SECRET-nya (SUPABASE_SERVICE_ROLE_KEY, DUITKU_*) memakai --sensitive supaya
#    tidak terbaca plaintext di dashboard.
#
# Pakai dari dalam container DDEV:
#   ddev exec bash scripts/vercel-env-sync.sh
#
#-opsional: nama project (default: gift-wedding-invitation)

set -euo pipefail

PROJECT="${1:-gift-wedding-invitation}"
VERCEL=(npx --yes vercel@latest)

cd /var/www/html

if [ ! -f .env ]; then
  echo "ERROR: .env tidak ada di root project." >&2
  exit 1
fi

# DATABASE_URL dan SUPABASE_DB_REGION hanya dipakai scripts/db-migrate.sh yang
# berjalan di mesin lokal. Kirim ke Vercel tidak ada gunanya dan menambah
# jejak password database di dashboard.
LEWATI=" DATABASE_URL SUPABASE_DB_REGION "

# Host DDEV tidak boleh dipakai di produksi: middleware memakainya untuk
# mengenali subdomain custom, jadi di Vercel harus dinetralkan supaya
# subdomain produksi tidak ikut ter-rewrite ke host lokal.
OVERRIDE_BASE_DOMAIN="localhost"

kunci() { grep -oE '^[A-Z0-9_]+' .env | sort -u; }

nilai() {
  # Cetak nilai apa adanya, tanpa quotes, supaya panjang header tidak
  # salah hitung.
  grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '\r'
}

echo "Menyinkronkan .env ke project Vercel: $PROJECT"
echo

gagal=0
for KEY in $(kunci); do
  case "$LEWATI" in
    *" $KEY "*) continue ;;
  esac

  VAL="$(nilai "$KEY")"
  if [ "$KEY" = "NEXT_PUBLIC_BASE_DOMAIN" ]; then
    VAL="$OVERRIDE_BASE_DOMAIN"
  fi

  # Hapus dulu semua target supaya tidak ada nilai lama yang tertinggal, lalu
  # buat ulang satu per satu.
  for TARGET in production preview; do
    "${VERCEL[@]}" env rm "$KEY" "$TARGET" --yes >/dev/null 2>&1 || true
  done

  if [[ "$KEY" == NEXT_PUBLIC_* ]]; then
    TARGETS=(production preview)
  else
    TARGETS=(production)
  fi

  HASIL=""
  for TARGET in "${TARGETS[@]}"; do
    if [[ "$KEY" == NEXT_PUBLIC_* ]]; then
      if printf '%s\n' "$VAL" | "${VERCEL[@]}" env add "$KEY" "$TARGET" --yes >/dev/null 2>&1; then
        HASIL="$HASIL ${TARGET}=OK"
      else
        HASIL="$HASIL ${TARGET}=GAGAL"
        gagal=$((gagal + 1))
      fi
    else
      if printf '%s\n' "$VAL" | "${VERCEL[@]}" env add "$KEY" "$TARGET" --sensitive --yes >/dev/null 2>&1; then
        HASIL="$HASIL ${TARGET}=OK"
      else
        HASIL="$HASIL ${TARGET}=GAGAL"
        gagal=$((gagal + 1))
      fi
    fi
  done

  KET=""
  case "$KEY" in
    NEXT_PUBLIC_BASE_URL | NEXT_PUBLIC_BASE_DOMAIN) KET=" = $VAL" ;;
  esac

  if [[ "$HASIL" == *"GAGAL"* ]]; then
    printf 'GAGAL %-36s %s%s\n' "$KEY" "$HASIL" "$KET"
  else
    printf 'OK    %-36s %s%s\n' "$KEY" "$HASIL" "$KET"
  fi
done

echo
if [ "$gagal" -gt 0 ]; then
  echo "Selesai, $gagal kegagalan. Build ulang dengan: ddev exec npx --yes vercel@latest deploy --prod --yes"
  exit 1
fi

echo "Selesai, semua env tersinkron."
echo "Build ulang dengan: ddev exec npx --yes vercel@latest deploy --prod --yes"
