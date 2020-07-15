![logo](https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/static%2Fog-wall-of-blobs-big.png?alt=media&token=9c2ec0c0-3e76-4603-a5a4-8a79e1373574)

# cactus
Cactus App

See the [Flamelink Docs](FLAMELINK.md)

## Dev Runtime Environment
### Node
You must use node version == 10.18.1.

See [Firebase Runtime Environments](https://cloud.google.com/functions/docs/concepts/exec#runtimes) for more information


## Installing Dependencies
You can install the suggested version using the bash script in the root of this repo:
```bash
# From project root
. node-version.sh
```  
> NOTE: Don't forget the leading period in the script, otherwise your current version of node won't get updated in your current terminal session
This will install correct version via [Node Version Manager](https://github.com/nvm-sh/nvm). If you do not have NVM installed yet, the script will install it for you.


## Development
Run `npm run dev` from the `/web` directory to run the local dev server. It will run `webpack-dev-server` and launch a server on `localhost:8080`. Static assets (images) are served out of the `/src/assets` directory. The dev server supports hot reloading of javascript and sass files.

Since static assets (images, etc) are served from the `src` directory, all changes should be available immediately

> This project uses TypeScript. All new javascript files should be added as `.ts` (not .js). .js files will no longer compile.

## Animating with GSAP & ScrollMagic
[ScrollMagic Docs](https://scrollmagic.io/docs/index.html)
[GSAP Docs](https://greensock.com/docs/NPMUsage)

## Frontend Environment Variables (Config)
At build time, we inject environment variables into a config file: `src/scripts/config.ts`. The values here should begin and end with double underscores as they are replaced by webpack at build-time. Example parameter is `__MY_PARAM__`.  In the `config.ts` file, we declare these variables so that typescript doesn't complain about them. We can then leverage any of of these variables at runtime by importing the config file.

To add a new variable, upadte all three config files located in `/web/webpack`. There is a config for `prod`, `stage`, and `dev`.   

## Deployments
Run `npm run deploy:stage` or `npm run deploy:prod`. Configuration in `firestore.json` has a predeploy hook that runs the npm script to build the assets needed.

The pre-deployment hook (`npm run predeploy`) has 3 steps:
1) clean the output directory (`/public`), i.e. delete all files from this directory
2) copy static assets from `/src/assets` into the output directory, maintaining the subdirectory structure
3) build javascript and css assets via webpack (`npm run build`). Webpack outputs the built files into the output directory (`/public`). Files generated from webpack have the hash of the contents of the file in it's name to help with caching on the CDN.     

Once the pre-deployment step completes, all the contents of the `/public` directory is uploaded to firebase and your changes will be live.

### Deployment Build Script
There is a special webpack config file called `webpack.deploy.config.js` that reads the environment variable `GCLOUD_PROJECT`, which the firebase CLI provides at runtime for the current project (usually set with the `-P` flag, or uses the default foudn in `.firebaserc`). The webpack script then checks if the projectID is equal to prod or stage, and returns the appropriate webpack config (`webpack.config.prod` or `webpack.config.stage`). If the environment flag `GCLOUD_PROJECT` is not present at runtime, the program crashes.

If you want to test the build script for stage or prod manually, you can run `npm run predeploy:stage` or `npm predeploy:prod` to force the projectID environment variable.   

## Analytics
Apparently, universal analytics has been replaced by google tag script. See here for documentation on events: https://developers.google.com/analytics/devguides/collection/gtagjs/events

## Admin Credentials
If you need programmatic access to admin credentials, please let Neil know. This is used if you need to run things in the `/scripts` directory. The credentials file is stored in 1password and should be saved as a file named `applicationCredentials_prod.json` and `applicationCredentials_stage.json` in the root of this project. This file should NEVER be checked into source control (the above filename is listed in gitignore).  

## Helpful Scripts

### GIT Cleanup Branches
if you want to clean up your local list of branches that have been deleted from the remote repo you can run these commands
 ```bash 
#first, do a dry run
git remote prune origin --dry-run 
```

```bash
#if you are happy with the results, just remove --dry-run to actually execute it
git remote prune origin
```

if you have a number of branches checkout out locally, you can clean up the ones that have already been merged by using this command
```bash
git branch --merged master | grep -v '^[ *]*master$' | xargs git branch -d 
```