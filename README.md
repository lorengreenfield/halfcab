<p align="center"><img width="300" src="https://js.resorts-interactive.com/halfcab/halfcab.svg"></p>

Halfcab is a universal JavaScript framework that assembles some elegant and easy to use libraries made by some very clever people, then adds some glue, sets some defaults, and hides a bit of the implementation so you don't have to worry about it.

[![CircleCI](https://circleci.com/gh/lorengreenfield/halfcab.svg?style=shield)](https://circleci.com/gh/lorengreenfield/halfcab) [![Coverage Status](https://coveralls.io/repos/github/lorengreenfield/halfcab/badge.svg?branch=master)](https://coveralls.io/github/lorengreenfield/halfcab?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/lorengreenfield/halfcab.svg)](https://greenkeeper.io/)

## What you get

- Syntax is the "web platform" - JavaScript, CSS, HTML
- Component based with es2015 template literals
- Components contain JS, HTML and CSS altogether in one file
- Both browser and server side component rendering
- Easy state management


halfcab exposes a bunch of functions and objects that you import from the halfcab module. If you want to grab them all at once ( you don't ), it'd look like this:

```js
import halfcab, { html, css, cache, injectHTML, injectMarkdown, geb, eventEmitter, updateState, state, cd, emptyBody, formField, formIsValid, ssr, defineRoute, gotoRoute, http } from 'halfcab'
```

## Installation
`npm install halfcab --save`


## How to use it

#### Setup
- `default` ( the default function sets up halfcab in the browser with your options )

This happens in the browser only:

```js
import halfcab, { emptyBody } from 'halfcab'

halfcab({
    baseName: 'My company',//tab title base name
    components, //top level component module
    postUpdate() {
        //do something after each dom update
    }
}).then( root => {
    emptyBody()
    document.body.appendChild(root)
    //run init function here
}).catch(err => {
    console.log(err)
})
```
Note the use of the utility function `emptyBody` to clear out the html body before appending the root element as a replacement.

#### Components
- `html` - creates dom elements from template literals
- `css` - injects css into html component's class property
- `cache` - wrapper function to increase performance of reusable components by caching them. Use later on in your project when making performance tweaks.
- `injectHTML` - injects html from a string, much like a triple mustache or React's dangerouslySetInnerHTML
- `injectMarkdown` - the same as `injectHTML` but first converts markdown into HTML, making sure HTML entities are not double encoded.

Under the hood, halfcab uses bel + nanomorph, which turns tagged template literals into dom elements.

Here's an example of a simple component:
```js
import { html } from 'halfcab'

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
                >Log in <i class="material-icons" style="vertical-align: inherit">account_circle</i>
                </button>         
             </div>
        </nav>
    </header> 
`

```

This is just regular HTML with one twist - Using event handlers like onclick will use the scope of your component, not the global scope. Just don't use quotation marks around it. Put it within ${ } instead.

halfcab uses csjs for inline css, like so:
```js
import { html, css } from 'halfcab'

var cssVar = '#FFCC00'

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
`

export default args => html`
   
    <header class=${styles.header}>
        <nav>
            <div style="width: 280px;">
                <img src="${args.company.logo.url}" />
            </div>
        
            <div style="width: 216px; text-align: center;">
                        
                <button onclick=${e => {
                alert('I am a button')
                }}>Log in <i class="material-icons" style="vertical-align: inherit">account_circle</i>
                </button>           
            </div>
        </nav>
    </header> 
`

```
Notice how you can use media queries, and inject variables using JavaScript! The CSS is scoped to your component so doesn't affect the rest of the app.


If you want a bit of a performance boost with components that you know will be re-rendered quite often, but won't change (args passed in will always be the same), use the `cache` wrapper function. You can use this with all components except the root one. This shouldn't be used to begin with as you often don't need it and it's best to keep things simple.

```js
import {html, formField, cache} from 'halfcab'

const singleField = ({holdingPen, name, property, styles, type, required, pattern}) => html`

    <div>
        <input value="${holdingPen[property]}" type="${type}" oninput=${formField(holdingPen, property)} class="${styles.input}" ${required ? `required` : ''} />
        <label>${name}</label>
        <div></div>
    </div>
`

export default args => cache(singleField, args)
```
This essentially acts as a component cache. Notice that instead of just returning your component as the default function, you're simply creating a separate constant that holds the function, and then passing that function, along with the args, into the cache wrapper function.

You'll end up with slightly better performance than React (but not React Fibre) using the `component` wrapper. See the [halfcab Sierpinski Triangle example](https://resorts-interactive.com/uiperftest.html).

It's worth mentioning here a second time, **don't wrap your root component**. Everything else is fine.


#### Events
- `geb` - global event bus
- `eventEmitter` - instantiate this for localised events

`geb` has 4 methods - broadcast, on, once, off.

Most often you'll use broadcast and on.

Listen for an event:
```js
import { geb } from 'halfcab'
geb.on('doStuff', args => {
    alert('Stuff happened')
})
```

Broadcast an event:
```js
import { geb } from 'halfcab'
geb.broadcast('doStuff', argsObject)
```

The off method will turn off listening to events, and you'll need a named function to reference, eg:
```js
var myFunc = args => {
    alert('Stuff happened from myFunc')
}
geb.on('doStuff', myFunc)

//......sometime later on

geb.off('doStuff', myFunc)
```

The `once` method is just like `on`, but once the event has been executed, it'll be switched off.

If you don't want your events to be global, new up an `eventEmitter` like so:

```js
import { eventEmitter } from 'halfcab'
var localEvents = new eventEmitter()

```
Then just use `localEvents` as you would `geb`

#### State management
- `state` - an object that contains the application state
- `updateState` - update the global state object. You can choose to do shallow or deep merging. If you want to you can achieve Redux style updates by using `geb`. Calling updateState will cause the state object to be updated and then re-rendered.

```js
import { updateState, geb } from 'halfcab'

geb.on('fieldUpdate', newValue => {
    updateState({
        field: {
            value: newValue
        }
    }, {
        deepMerge: false, //deep merging on by default, set to false to overwrite whole objects without merging
        arrayMerge: false //if deep merging then arrays will also merge by default. Set to false to not merge arrays.
    })
})

//....sometime later from somewhere else in the app

geb.broadcast('fieldUpdate', 23)

```

#### Utilities
- `cd` - an object to put client dependencies inside when running code in the browser (and equivalent empty mocks when doing server side rendering) *See the full example at the bottom of this document for usage*
- `emptyBody` - used to clear out the entire HTML body in the browser, to replace what's been rendered on the server. *See example usage in the setup section*
- `formField` - an easy way to create a holding pen object for form changes before sending it to the global state - good for when using oninput instead of onchanged or if you only want to update the global state once the data is validated.
- `formValid` - test if a holdingPen object's values are all valid. Halfcab will automatically populate a `valid` object within the holding pen that contains the same keys - this can either be object.valid or object[Symbol('valid')]. The validity of these is best set when you define the holding pen's initial values.

eg.

```js
import {html, formField, formValid} from 'halfcab'

let holidingPen = {
    value: '',
    valid: { 
        value: true//The starting value is considered valid
    }
}
//alternatively use holidingPen with a symbol valid object
let holidingPen = {
    value: '',
    [Symbol('valid')]: { 
        value: true//The starting value is considered valid
    }
}

export default args => html`
    <main>
        <div>
            <input type="text" oninput=${formField(holidingPen, 'value')}>
            <label for="my-textfield">Hint text</label>
        </div>
    </main>
`

//...sometime later, perhaps when subitting the form

if(!formValid(holdingPen)){
    alert('Form not valid')
}
```

#### Server side rendering
- `ssr` - wrap root component with the ssr function on the server to return an object with componentsString and stylesString properties to inject into your HTML base template *See the full example at the bottom of this document for usage*

To prevent doubling up on api calls (one from the SSR and one from the browser), you can send your initial data for the app to get things going and include it in your HTML using base 64 encoded JSON attached to a script tag like so:

```html
<script data-initial="${new Buffer(JSON.stringify(apiData)).toString('base64')}"></script>

```
This code is generated within node, so we have `Buffer` available to do base64 encoding. halfcab will decode this in the browser and set the first state with it, along with router information. (The state object contains a top level router object with a pathname property)
```js
state = {
    router: {
 	    pathname: '/reportpal'
    }
    
    //other stuff
}

```


#### Browser routing
- `defineRoute` - create a route
- `gotoRoute` - manually invoke a route ( otherwise, using `a` tags with href will do it for you )

halfcab tries not to force you to use a single solution for both server side and browser routing. Provide your own server side routing and then use `route` for setting up browser routes from halfcab.

Create a new route:
```js
import { defineRoute } from 'halfcab'
import myPageComponent from './myPageComponent'
defineRoute({path: '/reportpal', title: 'Report Pal', component: myPageComponent, callback(routeInfo){
    //this callback with route info is useful for making supplementary api calls
    console.log(routeInfo)//routInfo contains params, hash, query, href, pathname
}})
```

The `path` option sets the route path. Remember to include a forward slash as the first character of the route or if jumping to another site, http(s)://.
The title sets the HTML title of the page and tab when the route is hit.

Once your routes are set up using the `route` function, there's two ways to tell your app to go to that route.
1. a-href - Just use `a` tags as you normally would with the `href` property and the router will pick that up and route the app. The bonus of this approach is that using href is an easy way to help crawlers find their way through your site, and if structured carefully, you can also have basic navigation without the need for running JavaScript in the browser.

2. Use the `gotoRoute` function
```js
import { gotoRoute } from 'halfcab'
gotoRoute('/my-local-route')
```

### Other things worth mentioning

#### Network requests
halfcab uses `axios` internally for api calls and exports this as the `http` object for use in your own code. *See the axios docs on how to use it*


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
```js
import htmlTemplate from './htmlTemplate'

//somewhere else in file after http GET request to the route comes in:
htmlTemplate(someJSONData)

```

htmlTemplate.js

```js
import pack from '../../../package'
import components from '../../../components'
import { ssr, cd } from 'halfcab'
import { minify } from 'html-minifier'

cd.mock = function(val){//mock the client libraries

    return val
}

function htmlOutput(data){

    var apiData = data[0]
	var { componentsString, stylesString } = ssr(components(apiData))
	
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
                <body style="padding: 0px; margin: 0px;">
                
                ${componentsString}
                
                </body>
            </html>
`
}


export default function(data){

    return minify(htmlOutput(data), {
        collapseWhitespace: true,
        minifyCSS: true
    })
}
```

Notice we're also using the `cd` object to pass in a mock of our function. It's just a function that returns the argument that's passed in.

###### Browser JS structure

```
app.js
    |
    | ---imports - components.js
    |
    | ---imports - halfcab ( executed with components, automatically pulls in latest state (starting with injected initialData )
    
     
             
```
app.js
```js
import halfcab, { emptyBody, cd } from 'halfcab'
import './server/**/client.js'//registers client routes
import components from './components'
import someBrowserOnlyLib from 'someBrowserOnlyLib'

cd.mock = rootEl => {
    someBrowserOnlyLib()
        return rootEl
}

halfcab({
    baseName: 'Resorts Interactive',
    components
}).then( root => {
    emptyBody()
    document.body.appendChild(root)
}).catch(err => {
    console.log(err)
})

```
Notice:
1. This browser code is also creating an mock function to add to the cd object, but this time, it's actually importing the real someBrowserOnlyLib library and using it before returning the element.
2. The halfcab function returns a promise that returns our root element ready for us to use.

###### The common file between server and browser - components.js

```js
import { html, cd } from 'halfcab'
import topNav from './topNav'
import body from './body'
import footer from './footer'

function products(products){

    return {
        seemonster: products.find(item => item.name === 'SeeMonster'),
        vicomap: products.find(item => item.name === 'vicoMap'),
        reportpal: products.find(item => item.name === 'Report Pal')
    }
}

export default args => cd.mock(html`
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
`)
```

Notice how we're wrapping the default function with cd.mock - in the browser this results in autoInit being run on our element, and on the server, essentially does nothing but pass the element through.

This is our top level component, from here we're also pulling in three other components - topNav, body, and footer. This is the start of the tree-like component structure.



```