#!/usr/bin/env bash
source ~/.nvm/nvm.sh 2>/dev/null
source ~/.profile 2>/dev/null
source ~/.bashrc 2>/dev/null
source ~/.bash_profile 2>/dev/null

if [ ! -d ~/.nvm ]; then
    echo 'nvm is not installed, installing it now' >&2
    read -p "Do you want to install it now? " -n 1 -r
    echo    # (optional) move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        # do dangerous stuff
        echo "Installing NVM from github. See: https://github.com/nvm-sh/nvm#install--update-script"
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
        echo ''
        echo "NVM Installed successfully!"
        echo ''

    else
        echo "Can not continue with node configuration"
        exit 0
    fi
fi


echo "current node version is $(node -v)"
nvm install 10.18.1
nvm alias default 10.18.1

cd ~/.nvm/versions/node/v10.18.1/lib
echo "Updating NPM to latest version"
npm install npm