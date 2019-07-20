#!/usr/bin/env bash

#set -e

# latest commit
LATEST_COMMIT=$(git rev-parse HEAD)

echo "LATEST_COMMIT = ${LATEST_COMMIT}: $(git log -1 --pretty=%B)"

# latest commit where path/to/folder1 was changed
WEB_FOLDER_COMMIT=$(git log -1 --format=format:%H --full-diff web)

# latest commit where path/to/folder2 was changed
API_FOLDER_COMMIT=$(git log -1 --format=format:%H --full-diff functions)

SHARED_FOLDER_COMMIT=$(git log -1 --format=format:%H --full-diff shared)

if [[ ${WEB_FOLDER_COMMIT} = ${LATEST_COMMIT} ]];
    then
        echo "files in WEB has changed"
#        .circleci/do_something.sh
elif [[ ${API_FOLDER_COMMIT} = ${LATEST_COMMIT} ]];
    then
        echo "files in FUNCTIONS has changed"
#        .circleci/do_something_else.sh
elif [[ ${SHARED_FOLDER_COMMIT} = ${LATEST_COMMIT} ]];
    then
        echo "files in SHARED has changed"
#        .circleci/do_something_else.sh
else
     echo "no folders of relevance has changed"
#     exit 0;
fi