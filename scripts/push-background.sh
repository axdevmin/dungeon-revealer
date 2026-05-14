#!/usr/bin/env bash
# Usage: ./scripts/push-background.sh <image_file> [image_file...]
# Envoie une ou plusieurs images dans le dossier backgrounds du VPS.
# Les images sont immédiatement disponibles dans l'app sans redémarrage.

set -euo pipefail

VPS_HOST="bd1"
VPS_BACKGROUNDS="/home/ubuntu/navis-data/backgrounds"

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <image_file> [image_file...]"
  echo "Exemple: $0 ~/Downloads/mon_image.png"
  exit 1
fi

for file in "$@"; do
  if [[ ! -f "$file" ]]; then
    echo "Erreur: fichier introuvable: $file"
    exit 1
  fi

  ext="${file##*.}"
  ext_lower="${ext,,}"
  case "$ext_lower" in
    png|jpg|jpeg|webp|gif)
      ;;
    *)
      echo "Erreur: format non supporté: .$ext (png, jpg, jpeg, webp, gif uniquement)"
      exit 1
      ;;
  esac
done

echo "Envoi vers $VPS_HOST:$VPS_BACKGROUNDS ..."
rsync -avh --progress "$@" "$VPS_HOST:$VPS_BACKGROUNDS/"
echo "Terminé. Les backgrounds sont disponibles immédiatement dans Navis."
