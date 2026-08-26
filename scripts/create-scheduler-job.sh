#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-dogmap-476906}"
REGION="${REGION:-asia-northeast1}"
SERVICE="${SERVICE:-smobiz-factory}"
JOB="${JOB:-smobiz-factory-generate-hourly}"
SCHEDULE="${SCHEDULE:-0 * * * *}"
TIME_ZONE="${TIME_ZONE:-Etc/UTC}"
COUNT="${COUNT:-3}"
OIDC_SERVICE_ACCOUNT="${OIDC_SERVICE_ACCOUNT:-factory-deployer@${PROJECT_ID}.iam.gserviceaccount.com}"
SERVICE_URL="${SERVICE_URL:-$(gcloud run services describe "${SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')}"

gcloud scheduler jobs create http "${JOB}" \
  --project "${PROJECT_ID}" \
  --location "${REGION}" \
  --schedule "${SCHEDULE}" \
  --time-zone "${TIME_ZONE}" \
  --uri "${SERVICE_URL}/tasks/generate" \
  --http-method POST \
  --headers "Content-Type=application/json" \
  --message-body "{\"count\":${COUNT}}" \
  --oidc-service-account-email "${OIDC_SERVICE_ACCOUNT}" \
  --oidc-token-audience "${SERVICE_URL}"
