![logo](https://firebasestorage.googleapis.com/v0/b/cactus-app-prod.appspot.com/o/static%2Fog-image.png?alt=media&token=b2d52de3-ecc5-42f4-a401-f4158d1c4296)

# cactus
Cactus App

## Development
Run `npm run dev` from the `/web` directory to run the local dev server. It will run `webpack-dev-server` and launch a server on `localhost:8080`. Static assets (images) are served out of the `/src/assets` directory. The dev server supports hot reloading of javascript and sass files. 

Since static assets (images, etc) are served from the `src` directory, all changes should be available immediately

> This project uses TypeScript. All new javascript files should be added as `.ts` (not .js). .js files will no longer compile. 

## Add a new webpage
Since we're not running a single page app, we have no routing layer. We need to create and set up routes manually. There are a few steps to this process (someday I may write a script to help automate this... but don't hold your breath).

Webpack will do some fancy injection into your html file to include your bundled javascript + stylesheet. 

### 1) Create your html file
in `web/src`, create a new `.html` file. Name it something descriptive for what the page represents. This name is _not_ customer facing (as long as you do all of the steps listed). For the sake of this example, let's assume the page is called `tutorial.html`. 
So, we should now have 

```
cactus/
└──-functions/
└──-web/
│   └───node_modules/
│   └───public/    
│   └───src/   
│   │   └───assets/ 
│   │   └───scripts/
│   │   └───styles/
│   │       index.html
│   │       404.html
│   │       ...
│   │       tutorial.html* <-- Your new file  
│   │   webpack.config.js
│   │   package.json
│   │   config.stage.js
│   │   config.prod.js
│   │   ...
│
│   README.md             
```

### 2) Create the stylesheet
in `web/src/styles/pages` create a file with the same name as the `html` file you created. So, for this tutorial: `tutorial.scss`
You may want to import common styles, so add the following: 

```sass
//tutorial.scss
@import "~styles/mixins";
@import "~styles/variables";
@import "~styles/common";

//Your page specific styles go here
```


### 3) Create the TypeScript file
in `web/src/scripts/pages` create a file with the same name as the `html` file you created. So, for this tutorial: `tutorial.ts`

Add the following snippet of javascript to includes your page's stylesheet and a generic page load handler:

```typescript
//tutorial.ts
import "styles/pages/tutorial.scss"


document.addEventListener('DOMContentLoaded', function() {
    console.log("Tutorial Page Loaded")
})

```

Your file structure should now look something like this:

```
cactus/
└──-functions/
└──-web/
│   └───node_modules/
│   └───public/    
│   └───src/   
│   │   └───assets/ 
│   │   └───scripts/
│   │   │   └───pages/
│   │   │      tutorial.ts* <-- Your new TypeScript file  
│   │   └───styles/
│   │       └───pages/
│   │           tutorial.scss* <-- Your new stylesheet
│   │       index.html
│   │       404.html
│   │       ...
│   │       tutorial.html* <-- Your new html file
│   │   webpack.config.ts
│   │   package.json
│   │   config.stage.js
│   │   config.prod.js
│   │   ...
│
│   README.md             
```



### 4) Register the new page & route with webpack
Since this project is not a single page app, we need to tell webpack that we have another entry point that needs to get processed. We also need to tell webpack-dev-server about the new route we want to create.

Open `web/pages.js`. Add a new entry for your page, like the example below. Update the values for `path` to be the URL path you would like to use. Ensure it has preceeding `/`. This value will be used to match the url exactly via regex. 

> `NOTE`: we do not currently have support for nested routes (i.e. `/tutorial/subpage`) or dynamic routes (i.e. `/:id`)

```javascript
//pages.js
module.exports = {
    index: {title: "Home", path: "/"},
    // ... other routes here
    template: {title: "My Tutorial", path: "/tutorial"}, //This is your new route!    
    "404": {title: "Not Found"} //this is special, dont touch
}
```

### 5) Register the new page with Firebase Hosting
> `IMPORTANT`: If you do not do this, the deployed site will not know about your new route.

Open `/firebase.json` (in the root level of the project, not in /web). 

Under `hosting.rewrites` add your new route + filename. Notice that you do *NOT=* include the nested `/pages` folder. This is because at build time, these files get flattened out. 

```json
{
    ...
    "hosting": {
        ...
        "rewrites": [
              ...
              {
                "source": "/tutorial",
                "destination": "/tutorial.html"
              },
              {
                "source": "/",
                "destination": "/index.html"
              },
              {
                "source": "**",
                "destination": "/404.html"
              }
        ]
    },
    ...
}
```

Once you deploy (to stage first, hopefully!!), you should be able to hit your new page with the route specified. Obviously, you will want to keep the route in `firebase.json` consistent with what you set up in `pages.js` or else dev and stage/prod will have different behavior. 


## Deployments
Run `npm run deploy:stage` or `npm run deploy:prod`. Configuration in `firestore.json` has a predeploy hook that runs the npm script to build the assets needed. 

The pre-deployment hook (`npm run predeploy`) has 3 steps:
1) clean the output directory (`/public`), i.e. delete all files from this directory
2) copy static assets from `/src/assets` into the output directory, maintaining the subdirectory structure
3) build javascript and css assets via webpack (`npm run build`). Webpack outputs the built files into the output directory (`/public`). Files generated from webpack have the hash of the contents of the file in it's name to help with caching on the CDN.     
 
Once the pre-deployment step is completed, all the contents of the `/public` directory are uploaded to firebase and your changes will be live.


## Analytics

Apparently, universal analytics has been replaced by google tag script. See here for documentation on events: https://developers.google.com/analytics/devguides/collection/gtagjs/events