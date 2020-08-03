#!/usr/bin/env bash

echo "google project $GCLOUD_PROJECT"
[[ ${GCLOUD_PROJECT} = "cactus-app-prod" ]] && ENVIRONMENT="prod" || ENVIRONMENT="stage"


VERSION=$(sentry-cli releases propose-version)

echo "uploading source maps for $VERSION"
sentry-cli releases files "${VERSION}" upload-sourcemaps web/public --no-rewrite --log-level ERROR
