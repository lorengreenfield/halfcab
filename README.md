<p align="center"><img width="300" src="https://js.resorts-interactive.com/halfcab/halfcab.svg"></p>

Halfcab is a universal JavaScript framework that assembles some elegant and easy to use libraries made by some very clever people, then adds some glue, sets some defaults, and hides a bit of the implementation so you don't have to worry about it.

[![CircleCI](https://circleci.com/gh/lorengreenfield/halfcab.svg?style=shield)](https://circleci.com/gh/lorengreenfield/halfcab) [![Coverage Status](https://coveralls.io/repos/github/lorengreenfield/halfcab/badge.svg?branch=master)](https://coveralls.io/github/lorengreenfield/halfcab?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/lorengreenfield/halfcab.svg)](https://greenkeeper.io/)

## ES Modules required
Halfcab is no longer built as a common js distribution.

## What you get

- Syntax is the "web platform" - JavaScript, CSS, HTML
- Component based with es2015 template literals
- Components contain JS, HTML and CSS altogether in one file
- Both browser and server side component rendering
- Easy state management
- Form validation
- Client side routing (use server side routing of your choice)
- Markdown injection
- Global event bus and localized event emitter
- http requests (Axios)



halfcab exposes a bunch of functions and objects that you import from the halfcab module. If you want to grab them all at once ( you don't ), it'd look like this:

```js
import halfcab, { html, css, injectHTML, injectMarkdown, geb, eventEmitter, updateState, rerender, formField, formIsValid, fieldIsTouched, resetTouched, ssr, defineRoute, gotoRoute, http, getRouteComponent, nextTick, Component, LRU, PureComponent, cachedComponent } from 'halfcab'
```

## Installation
`npm install halfcab --save`


## How to use it

#### Setup
- `default` ( the default function sets up halfcab in the browser with your options )

This happens in the browser only:

```js
import halfcab from 'halfcab'

halfcab({
  el: '#root', // selector to mount root component on
  components,  // top level component module
}).then(({rootEl, state}) => {
  // rootEl and global state made available here if needed
}).catch(err => {
  console.log(err)
})
```

#### Components
- `html` - creates dom elements from template literals
- `css` - injects css into html component's class property
- `Component` - nanocomponent: https://www.npmjs.com/package/nanocomponent
- `LRU` - nanolru: https://www.npmjs.com/package/nanolru
- `PureComponent` - Extends Component and only rerenders when arguments change
- `cachedComponent` - pair with PureComponent to automatically cache components using LRU and only rerender when arguments change
- `injectHTML` - injects html from a string, much like a triple mustache or React's dangerouslySetInnerHTML
- `injectMarkdown` - the same as `injectHTML` but first converts markdown into HTML, making sure HTML entities are not double encoded.

Both injectHTML and injectMarkdown have a second argument for options. Currently there's just a single option:

```{wrapper: false}``` (default is true)

By default injected html will have a wrapping `<div>`. This is to ensure an html element can successfully be made (required by nanohtml)
If you know that your HTML already has a wrapping element, or it's just a single element, you can set the wrapper to false. Particularly useful when dealing with SVGs.

Under the hood, halfcab uses nanohtml + nanomorph, which turns tagged template literals into elements, and updates the DOM.

Here's an example of a simple component:
```js
import { html } from 'halfcab'

export default args => html`
  <header>
    <nav>
      <div style="width: 280px;">
        <img src="${args.company.logo.url}" />
      </div>
  
      <div style="width: 216px; text-align: center;" ${args.disabled ? {disabled} : ''}>        
        <button onclick=${e => {
        alert('I am a button')}} 
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
let cssVar = '#FFCC00'
let styles = css`
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
          alert('I am a button')}}>Log in <i class="material-icons" style="vertical-align: inherit">account_circle</i>
        </button>           
      </div>
    </nav>
  </header> 
`

```
Notice how you can use media queries, and inject variables using JavaScript! The CSS is scoped to your component so doesn't affect the rest of the app.


#### Performance
For larger apps you can get a major performance boost by using the provided `Component`, and `LRU` classes. See nanocomponent and nanolru libraries for details.

For convenience if you want to write pure components that are cached you can use `PureComponent` and not have to have an update method and return cached components like so:

```js
class DateTimePicker extends PureComponent {
  createElement(args) {
    this.myFunction = args.myFunction
    return html`<div>Datepicker ${args.something}</div>`
  }
}
export default args => cachedComponent(DateTimePicker, args, args.uniqueKey)

```

Make sure you have a uniqueKey (id) so that the component is properly cached and not referenced by any other call to cachedComponent

In the example above, the component that matches the uniqueKey will be extracted from the cache, the new args will be compared against the previous args, and if there's a difference, it will rerender, and if not, you'll just get the existing element from the cache. Note that this does a deep compare of objects and for functions it just copies them across. So make sure that all your functions are copied to `this`. If you see the line with `this.myFunction = args.myFunction` - this is done when the element is created, but it will also automatically be run for anything argument that is a function when performing an update. This is so that if your function argument has closed over any other variables from elsewhere, it always gets the latest function, even if it's not having to rerender the element.

#### Events
- `geb` - global event bus
- `eventEmitter` - instantiate this for localised events

`geb` has 4 methods - broadcast, on, once, off.

Most often you'll use broadcast and on.

Listen for an event:
```js
import { geb } from 'halfcab'
geb.on('doStuff', (passedInArgs, state) => {
  // note that the global state is passed in as the second argument to all geb listener callbacks
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
var myFunc = (passedInArgs, state) => {
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
- `updateState` - update the global state object. You can choose to do shallow or deep merging. If you want to you can achieve Redux style updates by using `geb`. Calling updateState will cause the state object to be updated and then re-rendered. Returns a promise that resolves the global state object.
- `rerender` - The global state is passed into the root component and is mutable, if you want to make deep changes within a component by mutating the state directly without using updateState, you can do so, followed by `rerender()`. By comparison, updateState merges/mutates the state and then runs rerender for you.

```js
import { updateState, geb } from 'halfcab'

geb.on('fieldUpdate', (newValue, state) => {
  updateState({
      field: {
          value: newValue
      }
  }, {
    deepMerge: false, // deep merging on by default, set to false to overwrite whole objects without merging
    arrayMerge: false, // if deep merging then arrays will also merge by default. Set to false to not merge arrays.,
    rerender: false // if you want to control rerendering yourself (if you want to wait to async functions to complete) then set rerender to false and call the rerender() function later on when you're ready
  })
})

//....sometime later from somewhere else in the app

geb.broadcast('fieldUpdate', 23)

```

#### Utilities
- `formField` - an easy way to create a holding pen object for form changes before sending it to the global state - good for when using oninput instead of onchanged or if you only want to update the global state once the data is validated.
- `formIsValid` - test if a holdingPen object's values are all valid. Halfcab will automatically populate a `valid` object within the holding pen that contains the same keys - this can either be object.valid or object[Symbol('valid')]. The validity of these is best set when you define the holding pen's initial values. Likewise, there's a `touched` object with the same keys that keeps track of which form elements have received focus at least once - helpful for form validation feedback.
- `nextTick` - Run a function at the next batched update. Usage: `nextTick(myFunction)`

eg.

```js
import {html, formField, formIsValid, fieldIsTouched} from 'halfcab'

let holdingPen = {
  value: '',
  valid: { 
      value: true//The starting value is considered valid
  }
}
// alternatively use holdingPen with a symbol valid object
let holdingPen = {
  value: '',
  [Symbol('valid')]: { 
      value: true//The starting value is considered valid
  }
}

let holdingPen = {
  value: '',
  [Symbol('valid')]: { 
      value: true
  },
  [Symbol('touched')]: { // When formField is run against a property, its touched value is set to true
      value: true
  }
}
```

Use the touched value to attach a .touched class to your inputs so that you can only style them as invalid once the user has had a chance to interact with them
eg.
```js
 let input = html`<input class="${styles.checkbox} ${fieldIsTouched(holdingPen, property) === true ? styles.touched : ''}" type="checkbox" />`
```

export default args => html`
  <main>
    <div>
      <input type="text" oninput=${formField(holdingPen, 'value')}>
      <label for="my-textfield">Hint text</label>
    </div>
  </main>
`

// ...sometime later, perhaps when subitting the form

if(!formIsValid(holdingPen)){
  alert('Form not valid')
}
```

#### Reset fields being touched

Once you've submitted your form, you might want to set all touched fields to false again if you're emptying out anything like a password field. Use `resetTouched` to do so:

```js
resetTouched(holdingPen)
```

If you're dynamically wanting to change your form, you'll want to also alter the corresponding holdingPen so that you can correctly validate it 

You can add and remove properties to the holdingPen and retain correct validation by using the `addToHoldingPen` and `removeFromHoldingPen` functions.

eg:

```js
let holdingPen = {
  email: '',
  password: '',
  [Symbol('valid')]: {
    email: false,
    password: false
  },
  [Symbol('touched')]: {
    email: false,
    password: false
  }
}

addToHoldingPen(holdingPen, {
  test1: '',
  test2: '',
  [Symbol('valid')]: {
    test1: false,
    test2: false
  },
  [Symbol('touched')]: {
    test1: false,
    test2: false
  }
})

removeFromHoldingPen(holdingPen, [
  'test1',
  'password'
])

```

The above will leave you with a holding pen that has this structure:
```js
holdingPen = {
  email: '',
  test2: '',
  [Symbol('valid')]: {
    email: false,
    test2: false
  },
  [Symbol('touched')]: {
    email: false,
    test2: false
  }
}
```

test1 and test2 properties were added using an object with initial values, and then test1 and property were removed, using an array, since you're removing, you don't have to provide key values, just the keys.

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
    
  // other stuff
}

```


#### Browser routing
- `defineRoute` - create a route
- `gotoRoute` - manually invoke a route ( otherwise, using `a` tags with href will do it for you )

halfcab tries not to force you to use a single solution for both server side and browser routing. Provide your own server side routing and then use `route` for setting up browser routes from halfcab.

Create a new route:
```js
import { defineRoute } from 'halfcab'
defineRoute({path: '/reportpal', title: 'Report Pal', component: 'myPageComponent', callback(routeInfo, state){
    // this callback with route info is useful for making supplementary api calls
    // state is provided as the second argument
    console.log(routeInfo) // routInfo contains params, hash, query, href, pathname
}})

```
To create a route that is on the same domain, but outside the realms of your client side routing management (microsites, etc), use the external boolean:
```js
import { defineRoute } from 'halfcab'
defineRoute({path: '/reportpal', external: true})
```

The `path` option sets the route path. Remember to include a forward slash as the first character of the route or if jumping to another site, http(s)://.
The title sets the HTML title of the page and tab when the route is hit.

The `component` option allows you to set a value for automatically swapping out components. You can retreive route components us using getRouteComponent(key)
You would typically use this with the current route's component, using router.key like so:
```js
let routedComponent = state => html`
  <div>${getRouteComponent(state.router.key)(state)}</div>
`

```
You *could* set this as the component itself, but to make server side rendering easy and able to provide a component without needing a client side render, you should provide a string which you can then use to load in a component, for example:

```js
defineRoute({path: '/reportpal', 
  title: 'Report Pal', 
  component: 'myPageComponent', 
  callback(routeInfo){
  // this callback with route info is useful for making supplementary api calls
  console.log(routeInfo)//routInfo contains params, hash, query, href, pathname
}})

// ...and in the component where you want the route change to automatically switch things:

import { html } from 'halfcab'

export default state => html`
  <div id="root">${getRouteComponent(state.router.key)(state)}</div>
`
```
If you want to pick a component based on something other than the route:

```js
import myPageComponent from './myPageComponent'
import myPageOtherComponent from './myPageOtherComponent'
let routeComponents = {
  myPageComponent,
  myPageOtherComponent
}

import { html } from 'halfcab'

export default state => html`
  <div id="root">${routeComponents[state.somevalue](state)}</div>
`

```

Once your routes are set up using the `defineRoute` function, there's two ways to tell your app to go to that route.
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
route.mjs
    |
    |
    | ---imports - htmlTemplate.mjs
                        |
                        | --- imports - components.mjs ( executed with initialData, which is also injected into the HTML head )
             
```

route.mjs could have a lot of other things going on ( it's up to you and your server side framework ) but the key part for us is that it runs:
```js
import htmlTemplate from './htmlTemplate'

//somewhere else in file after http GET request to the route comes in:
htmlTemplate(someJSONData)

```

htmlTemplate.mjs

```js
import pack from '../../../package'
import components from '../../../components'
import { ssr } from 'halfcab'
import { minify } from 'html-minifier'


function htmlOutput(data){
  let apiData = data[0]
	let { componentsString, stylesString } = ssr(components(apiData))
	
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


export default data => minify(htmlOutput(data), {
  collapseWhitespace: true,
  minifyCSS: true
})
```

###### Browser JS structure

```
app.mjs
    |
    | ---imports - components.mjs
    |
    | ---imports - halfcab ( executed with components, automatically pulls in latest state (starting with injected initialData )
    
     
             
```
app.mjs
```js
import halfcab from 'halfcab'
import './server/**/client' // registers client routes
import components from './components'

halfcab({
  el: '#root',
  components
}).catch(err => {
  console.log(err)
})

```
Notice:
1. This browser code is also creating an mock function to add to the cd object, but this time, it's actually importing the real someBrowserOnlyLib library and using it before returning the element.
2. The halfcab function returns a promise that returns our root element ready for us to use.

###### The common file between server and browser - components.mjs

```js
import { html } from 'halfcab'
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

This is our top level component, from here we're also pulling in three other components - topNav, body, and footer. This is the start of the tree-like component structure.
