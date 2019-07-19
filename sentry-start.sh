#!/usr/bin/env bash


VERSION=$(sentry-cli releases propose-version)
echo "creating sentry release for version $VERSION"
# Create a release
sentry-cli releases new -p cactus-web $VERSION

# Associate commits with the release
sentry-cli releases set-commits --auto $VERSION

export SENTRY_VERSION="${VERSION}"