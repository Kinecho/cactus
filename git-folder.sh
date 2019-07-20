#!/usr/bin/env bash

#set -e

# latest commit
LATEST_COMMIT=$(git rev-parse HEAD)

echo "LATEST_COMMIT = ${LATEST_COMMIT}: $(git log -m -1 --pretty=%B)"
echo ""
echo "=====Changed files===="
git diff-tree --no-commit-id --name-only -r "$LATEST_COMMIT"
echo "======================"
echo ""

# latest commit where path/to/folder1 was changed
WEB_FOLDER_COMMIT=$(git log -1 --format=format:%H --full-diff web)

# latest commit where path/to/folder2 was changed
API_FOLDER_COMMIT=$(git log -1 --format=format:%H --full-diff functions)

SHARED_FOLDER_COMMIT=$(git log -1 --format=format:%H --full-diff shared)

SCRIPTS_FOLDER_COMMIT=$(git log -1 --format=format:%H --full-diff scripts)

FIREBASE_COMMANDS=()


function join_by { local IFS="$1"; shift; echo "$*"; }


if [[ ${SHARED_FOLDER_COMMIT} = ${LATEST_COMMIT} ]] || [[ ${WEB_FOLDER_COMMIT} = ${LATEST_COMMIT} ]];
    then
        echo "Commit has web or shared, adding hosting to deploy list"
        FIREBASE_COMMANDS+=('hosting')
fi

if [[ ${SHARED_FOLDER_COMMIT} = ${LATEST_COMMIT} ]] || [[ ${API_FOLDER_COMMIT} = ${LATEST_COMMIT} ]];
    then
        echo "Commit has functions or shared, adding functions to deploy list"
        FIREBASE_COMMANDS+=('functions')
fi


if [[ ${SHARED_FOLDER_COMMIT} = ${LATEST_COMMIT} ]];
    then
        echo "files in SHARED has changed - not doing anything special"
fi

if [[ ${SCRIPTS_FOLDER_COMMIT} = ${LATEST_COMMIT} ]];
    then
        echo "files in SCRIPTS has changed - need to run tests"
fi

join_by , ${FIREBASE_COMMANDS[@]}