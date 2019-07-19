#!/usr/bin/env bash

echo "google project $GCLOUD_PROJECT"
[[ $GCLOUD_PROJECT = "cactus-app-prod" ]] && ENVIRONMENT="prod" || ENVIRONMENT="stage"


VERSION=$(sentry-cli releases propose-version)
echo "Releasing version $VERSION to $ENVIRONMENT"
sentry-cli releases deploys VERSION new -e ENVIRONMENT

