#!/usr/bin/env bash

#set -e

# latest commit
LATEST_COMMIT=$(git rev-parse HEAD)


echo "======== CHANGE LIST ========="
echo "${LATEST_COMMIT}"
git log -m -1 --pretty=%B
git diff-tree --no-commit-id -m --name-only -r "$LATEST_COMMIT"
echo ""

# latest commit where path/to/folder1 was changed
WEB_FOLDER_COMMIT=$(git log -m -1 --name-only --format=format:%H  web)
#git diff-tree --no-commit-id -m --name-only -r "$LATEST_COMMIT" web && HAS_WEB_CHANGES=true || HAS_WEB_CHANGES=false

echo "============ Web ============="
WEB_FILES=$(git diff-tree --no-commit-id -m --name-only -r "$LATEST_COMMIT" web )

HAS_WEB_CHANGES=false
if [[ WEB_FILES ]]; then
    echo "${WEB_FILES}"
    HAS_WEB_CHANGES=true
else
    echo "No Changes"
fi
echo ""

API_FOLDER_COMMIT=$(git log -m -1 --name-only --format=format:%H --full-diff functions)

echo "============ API ============="
API_FILES=$(git diff-tree --no-commit-id -m --name-only -r "$LATEST_COMMIT" functions | xargs)

HAS_API_CHANGES=false
if [[ ${API_FILES} ]]; then
    echo "${API_FILES}"
    HAS_API_CHANGES=true
else
    echo "No changes"
fi

echo ""


echo "=========== SHARED ==========="
SHARED_FILES=$(git diff-tree --no-commit-id -m --name-only -r "$LATEST_COMMIT" shared | xargs)

HAS_SHARED_CHANGES=false
if [[ ${SHARED_FILES} ]]; then
    echo "${SHARED_FILES}"
    HAS_SHARED_CHANGES=true
else
    echo "No changes"
fi
echo ""



echo "=========== SCRIPTS ==========="
SCRIPTS_FILES=$(git diff-tree --no-commit-id -m --name-only -r "$LATEST_COMMIT" scripts | xargs)

HAS_SCRIPTS_CHANGES=false
if [[ ${SCRIPTS_FILES} ]]; then
    echo "${SCRIPTS_FILES}"
    HAS_SCRIPTS_CHANGES=true
else
    echo "No Changes"
fi
echo "==============================="
echo ""

#echo ${API_FILES}
#git diff-tree --no-commit-id -m --name-only -r "$LATEST_COMMIT" functions && HAS_API_CHANGES=true || HAS_API_CHANGES=false
#echo "Has Functions Changes = ${HAS_API_CHANGES}"

SHARED_FOLDER_COMMIT=$(git log -m --name-only -1 --format=format:%H --full-diff shared)

SCRIPTS_FOLDER_COMMIT=$(git log -m --name-only -1 --format=format:%H --full-diff scripts)

FIREBASE_COMMANDS=()


function join_by { local IFS="$1"; shift; echo "$*"; }


if [[ ${HAS_WEB_CHANGES} || ${HAS_SHARED_CHANGES} ]]; then
        echo "Adding hosting to deploy list"
        FIREBASE_COMMANDS+=('hosting')
fi

if [[ ${HAS_API_CHANGES} || ${HAS_SHARED_CHANGES} ]]; then
        echo "Adding functions to deploy list"
        FIREBASE_COMMANDS+=('functions')
fi

if [[ ${HAS_SHARED_CHANGES} ]]; then
        echo "files in SHARED has changed - not doing anything special"
fi

if [[ ${HAS_SCRIPTS_CHANGES} ]]; then
        echo "files in SCRIPTS has changed - need to run tests"
fi


FIREBASE_MODULES=$(join_by , ${FIREBASE_COMMANDS[@]})

echo
echo "Will execute firebase command \"firebase deploy --only ${FIREBASE_MODULES}\""