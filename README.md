<p align="center"><img width="300" src="https://js.resorts-interactive.com/halfcab/halfcab.svg"></p>

Halfcab is a universal JavaScript framework that assembles some elegant and easy to use libraries made by some very clever people, then adds some glue, sets some defaults, and hides a bit of the implementation so you don't have to worry about it.

## What you get
- Syntax is the "web framework" - JavaScript, CSS, HTML
- Component based with es2015 template literals
- Components contain JS, HTML and CSS altogether in one file
- Both browser and server side component rendering
- State management, including state history tracking for easy undo-redo
- Built to work with material-components-web (UI components)


halfcab exposes a bunch of functions that you import from the halfcab module. If you want to grab them all at once ( you don't ), it'd look like this:

```
import halfcab, { html, css, injectHTML, geb, eventEmitter, updateState, states, cd, emptyBody, formField, ssr, route, router } from 'halfcab';
```

## Installation
`npm install halfcab --save`


## How to use it

#### Setup
- `default` ( the default function sets up halfcab in the browser with your options )

This happens in the browser only:

```
import halfcab, { emptyBody } from 'halfcab';
halfcab({
    baseName: 'My company',//tab title base name
    baseApiPath: '/api/webroutes',
    components, //top level component module
    maxStates: 5 //how many states to store in the states array
}).then( root => {
    emptyBody();
    document.body.appendChild(root);
}).catch(err => {
    console.log(err);
});
```
Note the use of the utility function `emptyBody` to clear out the html body before appending the root element as a replacement.

#### Components
- `html` - creates dom elements from template literals
- `css` - injects css into html component's class property
- `injectHTML` - injects html from a string, much like a triple mustache or React's dangerouslySetInnerHTML

Under the hood, halfcab uses yo-yo, which in turn uses bel. bel turns tagged template literals into dom elements.

Here's an example of a simple component:
```
import { html } from 'halfcab';

export default args => html`
   
    <header>
        <nav>
			<div style="width: 280px;">
				<img src="${args.company.logo.url}" />
			</div>
        
			<div style="width: 216px; text-align: center;">
                        
				<button onclick=${e => {
				alert('I am a button')
				}} 
				data-mdc-auto-init="MDCRipple" 
				class="mdc-button mdc-button--raised mdc-button--accent">Log in <i class="material-icons" style="vertical-align: inherit">account_circle</i>
				 </button>         
             </div>
		</nav>
    </header> 
`;

```

This is just regular HTML with one twist - Using event handlers like onclick will use the scope of your component, not the global scope. Just don't use quotation marks around it. Put it within ${ } instead.

halfcab uses csjs for inline css, like so:
```
import { html, css } from 'halfcab';

var cssVar = '#FFCC00';

var styles = css`
    
    .header > nav {
        display: flex;
        align-items: center; 
        justify-content: space-between;
        flex-wrap: wrap; 
        align-content: center;
        background-color: ${cssVar}
    }
    
    @media (max-width: 720px) {
        .header > nav {
            flex-direction: column;
        }
    }
`;

export default args => html`
   
    <header class=${styles.header}>
        <nav>
			<div style="width: 280px;">
				<img src="${args.company.logo.url}" />
			</div>
        
			<div style="width: 216px; text-align: center;">
                        
				<button onclick=${e => {
				alert('I am a button')
				}} 
				data-mdc-auto-init="MDCRipple" 
				class="mdc-button mdc-button--raised mdc-button--accent">Log in <i class="material-icons" style="vertical-align: inherit">account_circle</i>
				 </button>         
             </div>
		</nav>
    </header> 
`;

```
Notice how you can use media queries, and inject variables using JavaScript! The CSS is scoped to your component so doesn't affect the rest of the app.


#### Events
- `geb` - global event bus
- `eventEmitter` - instantiate this for localised events

`geb` has 4 methods - broadcast, on, once, off.

Most often you'll use broadcast and on.

Listen for an event:
```
import { geb } from 'halfcab';
geb.on('doStuff', args => {
	alert('Stuff happened');
});
```

Broadcast an event:
```
import { geb } from 'halfcab';
geb.broadcast('doStuff', argsObject);
```

The off method will turn off listening to events, and you'll need a named function to reference, eg:
```
var myFunc = args => {
	alert('Stuff happened from myFunc');
}
geb.on('doStuff', myFunc);

......sometime later on

geb.off('doStuff', myFunc);
```

The `once` method is just like `on`, but once the event has been executed, it'll be switched off.

If you don't want your events to be global, new up an `eventEmitter` like so:

```
import { eventEmitter } from 'halfcab';
var localEvents = new eventEmitter();

```
Then just use `localEvents` as you would `geb`;

#### State management
- `states` - an array storing 50 states by default (can be set within options)
- `updateState` - update the global state object. You can choose to do shallow or deep merging. If you want to you can achieve Redux style updates by using `geb`. Calling updateState will cause components to re-render, and a new state object to be pushed onto the end of the states array (Removing the first item in the array if it's reached the maxStates allowed).


```
import { updateState, geb } from 'halfcab';

geb.on('fieldUpdate', newValue => {
    updateState({
        field: {
            value: newValue
        }
    }, {
        deepMerge: true
    })
});

....sometime later from somewhere else in the app

geb.broadcast('fieldUpdate', 23);

```

#### Utilities
- `cd` - an object to put client dependencies inside when running code in the browser (and equivalent empty mocks when doing server side rendering) *See the full example at the bottom of this document for usage*
- `emptyBody` - used to clear out the entire HTML body in the browser, to replace what's been rendered on the server. *See example usage in the setup section*
- `formField` - an easy way to create a holding pen object for form changes before sending it to the global state - good for when using oninput instead of onchanged or if you only want to update the global state once the data is validated. *See the full example at the bottom of this document for usage*

#### Server side rendering
- `ssr` - wrap root component with the ssr function on the server to return an object with componentsString and stylesString properties to inject into your HTML base template *See the full example at the bottom of this document for usage*

To prevent doubling up on api calls (one from the SSR and one from the browser), you can send your initial data for the app to get things going and include it in your HTML using base 64 encoded JSON attached to a script tag like so:

```
<script data-initial="${new Buffer(JSON.stringify(apiData)).toString('base64')}"></script>

```
This code is generated within node, so we have `Buffer` available to do base64 encoding. halfcab will decode this in the browser and set the first state with it, along with router information. (The state object contains a top level router object with a pathname property)
```
state = {
 router: {
 	pathname: '/reportpal'
 }
 //other stuff
 }

```


#### Browser routing
- `route` - create a route
- `router` - manually invoke a route ( otherwise, using `a` tags with href will do it for you )

halfcab tries not to force you to use a single solution for both server side and browser routing. Provide your own server side routing and then use `route` for setting up browser routes from halfcab.

Create a new route:
```
import { route } from 'halfcab';
route({path: '/reportpal', title: 'Report Pal', skipApiCall: true}, output =>{
    //do something
});
```
Calling a route will also automatically make an API call to the route's name, prefixed with the `baseApiPath` property you used during setup by calling halfcab(). You can tell it to not make that call by setting `skipApiCall: true` in the options.

The `path` option sets the route path. Remember to include a forward slash as the first character of the route or if jumping to another site, http(s)://.
The title sets the HTML title of the page and tab when the route is hit.

The trailing function is a callback that's executed when the route is hit. If you let the API be called, the callback will have a populated output argument with the result of any API call.


Once your routes are set up using the `route` function, there's two ways to tell your app to go to that route.
1. a-href - Just use `a` tags as you normally would with the `href` property and the router will pick that up and route the app. The bonus of this approach is that using href is an easy way to help crawlers find their way through your site, and if structured carefully, you can also have basic navigation without the need for running JavaScript in the browser.

2. Use the `router` function
```
import { router } from 'halfcab';
router('/my-local-route');
```

### Other things worth mentioning

#### Network requests
halfcab uses `axios` internally for api calls, so feel free to import that into your own code.

#### UI library
halfcab is designed to work with the excellent material-components-web library.
Use the `cd` object to include it as a client (browser) dependency. *See the full example below for usage*


### Putting it all together and structuring your code

Both browser and server code will pull in your top level component, but they each have entirely different entry points. This allows you to determine how the components are rendered in each environment and means you don't have to include all the client dependencies while doing server side rendering. It also means you can stick with your preferred server side routing ( hapi, express, koa, etc )

###### Server file structure

```
route.js
    |
    |
    | ---imports - htmlTemplate.js
                        |
                        | --- imports - components.js ( executed with initialData, which is also injected into the HTML head )
             
```

route.js could have a lot of other things going on ( it's up to you and your server side framework ) but the key part for us is that it runs:
```
import htmlTemplate from './htmlTemplate';

//somewhere else in file after http GET request to the route comes in:
htmlTemplate(someJSONData);

```

htmlTemplate.js

```
import pack from '../../../package';
import components from '../../../components';
import { ssr, cd } from 'halfcab';
import { minify } from 'html-minifier';

cd.mdc = function(val){//mock the client libraries

    return val;
};

function htmlOutput(data){

    var apiData = data[0];
	var { componentsString, stylesString } = ssr(components(apiData));
	
    return `<!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>Resorts Interactive</title>
                    <link rel="shortcut icon" href="/staticimages/favicon.png" type="image/png"/>
                    <link rel="stylesheet" href="/css/${pack.version}">
                    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
 
                    <meta name="viewport" content="width=device-width, user-scalable=no"/>
                    <style>${stylesString}</style>
                    <script id="initialData" data-initial="${new Buffer(JSON.stringify(apiData)).toString('base64')}"></script>
                    <script src='/js/${pack.version}' defer></script>
                  
                   
                </head>
                <body class="mdc-typography" style="padding: 0px; margin: 0px;">
                
                ${componentsString}
                
                </body>
            </html>
`;
}


export default function(data){

    return minify(htmlOutput(data), {
        collapseWhitespace: true,
        minifyCSS: true
    })
}
```

Notice we're also using the `cd` object to pass in a mock of our material-components-web wrapper function. It's just a function that returns the argument that's passed in.

###### Browser JS structure

```
app.js
    |
    | ---imports - components.js
    |
    | ---imports - halfcab ( executed with components, automatically pulls in latest state (starting with injected initialData )
    
     
             
```
app.js
```
import halfcab, { emptyBody, cd } from 'halfcab';
import { autoInit } from 'material-components-web';
import './server/**/client.js';//registers client routes
import components from './components';

function mdc(rootEl){
    autoInit(rootEl);
    return rootEl;
}
cd.mdc = mdc;

halfcab({
    baseName: 'Resorts Interactive',
    baseApiPath: '/api/webroutes',
    components,
    maxStates: 5
}).then( root => {
    emptyBody();
    document.body.appendChild(root);
}).catch(err => {
    console.log(err);
});

```
Notice:
1. This browser code is also creating an mdc function to add to the cd object, but this time, it's actually importing the real material-components-web library and using the autoInit feature, before returning the element.
2. We've set max states to 5 instead of the default 50 (you can set this to how big or small you want) - this is so you can manage undo-redo systems, or a store time travel like Redux, if you find that useful.
3. The halfcab function returns a promise that returns our root element ready for us to use.

###### The common file between server and browser - components.js

```
import { html, cd } from 'halfcab';
import topNav from './topNav';
import body from './body';
import footer from './footer';
import find from 'lodash.find';

function products(products){

    return {
        seemonster: find(products, { name: 'SeeMonster' }),
        vicomap: find(products, { name: 'vicoMap' }),
        reportpal: find(products, { name: 'Report Pal' })
    }
}

export default args => cd.mdc(html`
    <div id="root" style="margin-top: 10px; text-align: center;">
        ${topNav({
            company: args.company,
            products: products(args.products)
            
        })}
        ${body({
            products: products(args.products),
            company: args.company
        })}
        ${footer()}
        
        ${injectHTML(args.safeHTMLFromServer)}
    </div>
`);
```

Notice how we're wrapping the default function with cd.mdc - in the browser this results in autoInit being run on our element, and on the server, essentially does nothing but pass the element through.

This is our top level component, from here we're also pulling in three other components - topNav, body, and footer. This is the start of the tree-like component structure.

## Bundling
halfcab doesn't need any special processing since it's all just JavaScript, CSS and HTML, but you'll want to bundle your files together. babelify/browserify, webpack, and rollup are all good choices. The yo-yo/bel community is more focused on browserify and it's probably the best choice for most apps because of that support and its simplicity. Webpack is the best choice if you want code splitting in a larger app or have some other processing requirements that need a bit of speed in your tool chain, and rollup is the best choice if you're wanting to include halfcab in your own library or framework.


## Work in progress
halfcab is a work in progress. It's matured quickly (with many iterations), but it will probably go though a lot more changes throughout 2017. As it gets used more and more in real world projects, it'll be tweaked to suit and the dust might settle a bit by 2018.