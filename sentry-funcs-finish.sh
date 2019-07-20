#!/usr/bin/env bash

echo "google project $GCLOUD_PROJECT"
[[ ${GCLOUD_PROJECT} = "cactus-app-prod" ]] && ENVIRONMENT="prod" || ENVIRONMENT="stage"


VERSION=$(sentry-cli releases propose-version)

echo "finalizing release for ${VERSION}"
sentry-cli releases finalize ${VERSION}

echo "Deploying version $VERSION to $ENVIRONMENT"
sentry-cli releases deploys ${VERSION} new -e ${ENVIRONMENT} --name=functions  || echo "SENTRY FAILED TO DEPLOY NEW VERSION"

