#!/bin/sh
set -e
mc alias set local http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"
for b in posts edms avatars icons ppt-thumbnails; do
  mc mb -p "local/${b}" && echo "created bucket: ${b}" || echo "bucket exists (ok): ${b}"
done
echo "minio-init done."
