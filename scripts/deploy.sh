#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-dogmap-476906}"
REGION="${REGION:-asia-northeast1}"
REPOSITORY="${REPOSITORY:-apps-repo}"
SERVICE="${SERVICE:-smobiz-factory}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE}:latest"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-factory-deployer@${PROJECT_ID}.iam.gserviceaccount.com}"
INVOKER_SERVICE_ACCOUNT="${INVOKER_SERVICE_ACCOUNT:-${SERVICE_ACCOUNT}}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"

npm test
gcloud builds submit --project "${PROJECT_ID}" --tag "${IMAGE}" .
gcloud run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE}" \
  --service-account "${SERVICE_ACCOUNT}" \
  --platform managed \
  --no-allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},AUTO_APPROVE=${AUTO_APPROVE}" \
  --set-secrets "DECISIONS_API_KEY=DECISIONS_API_KEY:latest" \
  --memory 1Gi \
  --cpu 1 \
  --timeout 900

gcloud run services add-iam-policy-binding "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --member "serviceAccount:${INVOKER_SERVICE_ACCOUNT}" \
  --role roles/run.invoker
