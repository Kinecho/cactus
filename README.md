# cactus
Cactus App

## Development
Simply run `npm run dev` from the `/web` directory to run the local dev server. It will run `webpack-dev-server` and launch a server on `localhost:8080`. Static assets (images) are served out of the `/src/assets` directory. The dev server supports hot reloading of javascript and sass files. 

Since static assets (images, etc) are served from the `src` directory, all changes should be available immediately

## Deployments
Simply run `npm run deploy:stage` or `npm run deploy:prod`. Configuration in `firestore.json` has a predeploy hook that runs the npm script to build the assets needed. 

The pre-deployment hook (`npm run predeploy`) has 3 steps:
1) clean the output directory (`/public`), i.e. delete all files from this directory
2) copy static assets from `/src/assets` into the output directory, maintaining the subdirectory structure
3) build javascript and css assets via webpack (`npm run build`). Webpack outputs the built files into the output directory (`/public`). Files generated from webpack have the hash of the contents of the file in it's name to help with caching on the CDN.     
 
Once the pre-deployment step is completed, all the contents of the `/public` directory are uploaded to firebase and your changes will be live.