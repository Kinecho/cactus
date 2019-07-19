#!/usr/bin/env bash



filename=.sentryclirc

if [ ! -f $filename ]
then
    echo "Sentry config did not exist, creating it now"
    touch $filename

    echo "[auth]" >> $filename
    echo "token=$(npx firebase functions:config:get sentry.api_token | sed -e 's/^"//' -e 's/"$//' )" >> $filename
    echo "[defaults]" >> $filename
    echo "org=kinecho" >> $filename
    echo "project=cactus-web" >> $filename

    echo "Created Sentry Config File using Firebase Configs"
else
    echo "Sentry config exists"
fi