#!/usr/bin/env bash


echo "google project ${GCLOUD_PROJECT}"
[[ ${GCLOUD_PROJECT} = "cactus-app-prod" ]] && ENVIRONMENT="prod" || ENVIRONMENT="stage"

#Need to set the version cloud functions here, as it happens before function upload


VERSION=$(sentry-cli releases propose-version)


echo "Firebase Functions sentry.release is currently set to $(npx firebase functions:config:get sentry.release)"
echo "setting sentry.release on cloud functions for env ${ENVIRONMENT}"
npx firebase functions:config:set sentry.release=${VERSION} -P ${ENVIRONMENT}


echo "Firebase Functions sentry.release is now set to $(npx firebase functions:config:get sentry.release)"

echo "creating sentry release for version ${VERSION}"
# Create a release
sentry-cli releases new -p cactus-functions ${VERSION}

# Associate commits with the release
sentry-cli releases set-commits --auto ${VERSION} || echo "FAILED TO SET COMMITS"

export SENTRY_VERSION="${VERSION}"