import shiftyRouterModule from 'shifty-router'
import hrefModule from 'shifty-router/href'
import historyModule from 'shifty-router/history'
import createLocation from 'shifty-router/create-location'
import bel from 'nanohtml'
import update from 'nanomorph'
import axios from 'axios'
import cssInject from 'csjs-inject'
import merge from 'deepmerge'
import marked from 'marked'
import htmlEntities from 'html-entities'
import eventEmitter from './eventEmitter'
import qs from 'qs'
import toSource from 'tosource'

const {AllHtmlEntities} = htmlEntities

let componentRegistry
let entities = new AllHtmlEntities()
let cssTag = cssInject
let componentCSSString = ''
let routesArray = []
let externalRoutes = []
let state = {}
let router
let rootEl
let components
let dataInitial
let el

marked.setOptions({
  breaks: true
})

function b64DecodeUnicode (str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

if (typeof window !== 'undefined') {
  componentRegistry = new Map()
  dataInitial = document.querySelector('[data-initial]')
  if (!!dataInitial) {
    state = (dataInitial && dataInitial.dataset.initial) && Object.assign({}, JSON.parse(b64DecodeUnicode(dataInitial.dataset.initial)))

    if (!state.router) {
      state.router = {}
    }

    if (!state.router.pathname) {
      Object.assign(state.router, {
        pathname: window.location.pathname,
        hash: window.location.hash,
        query: qs.parse(window.location.search)
      })
    }
  }
} else {

  cssTag = (cssStrings, ...values) => {
    let output = cssInject(cssStrings, ...values)
    componentCSSString += componentCSSString.indexOf(output[' css ']) === -1 ? output[' css '] : ''
    return output
  }
}

let geb = new eventEmitter({state})

let html = (strings, ...values) => {
  // fix for allowing csjs to coexist with nanohtml SSR
  values = values.map(value => {
    if (value && value.hasOwnProperty('toString')) {
      return value.toString()
    }
    return value
  })

  return bel(strings, ...values)
}

function ssr (rootComponent) {
  let componentsString = `${rootComponent}`
  return {componentsString, stylesString: componentCSSString}
}

function defineRoute (routeObject) {
  if (routeObject.external) {
    return externalRoutes.push(routeObject.path)
  }
  routesArray.push(routeObject)
}

function formField (ob, prop) {
  return e => {
    ob[prop] = e.currentTarget.type === 'checkbox' || e.currentTarget.type === 'radio' ? e.currentTarget.checked : e.currentTarget.value
    let validOb
    let touchedOb
    if (!ob.valid) {
      if (Object.getOwnPropertySymbols(ob).length > 0) {
        Object.getOwnPropertySymbols(ob).forEach(symb => {
          if (symb.toString().indexOf('Symbol(valid)') === 0 && ob[symb]) {
            validOb = symb
          }
        })
      } else {
        ob.valid = {}
        validOb = 'valid'
      }

    } else {
      validOb = 'valid'
    }

    Object.getOwnPropertySymbols(ob).forEach(symb => {
      if (symb.toString().indexOf('Symbol(touched)') === 0 && ob[symb]) {
        touchedOb = symb
      }
    })

    if (touchedOb) {
      if (!ob[touchedOb][prop]) {
        ob[touchedOb][prop] = true
        stateUpdated()
      }
    }

    ob[validOb][prop] = e.currentTarget.validity.valid
    console.log('---formField update---')
    console.log(prop, ob)
    console.log(`Valid? ${ob[validOb][prop]}`)
  }
}

function formIsValid (holidingPen) {
  let validProp = holidingPen.valid && 'valid'
  if (!validProp) {
    Object.getOwnPropertySymbols(holidingPen).forEach(symb => {
      if (symb.toString().indexOf('Symbol(valid)') === 0 && holidingPen[symb]) {
        validProp = symb
      }
    })

    if (!validProp) {
      return false
    }
  }

  let validOb = Object.keys(holidingPen[validProp])

  for (let i = 0; i < validOb.length; i++) {
    if (holidingPen[validProp][validOb[i]] !== true) {
      return false
    }
  }

  return true
}

function fieldIsTouched (holidingPen, property) {
  let touchedProp
  Object.getOwnPropertySymbols(holidingPen).forEach(symb => {
    if (symb.toString().indexOf('Symbol(touched)') === 0 && holidingPen[symb]) {
      touchedProp = symb
    }
  })

  if (!touchedProp) {
    return false
  }

  return !!holidingPen[touchedProp][property]
}

function resetTouched (holidingPen) {
  let touchedProp
  Object.getOwnPropertySymbols(holidingPen).forEach(symb => {
    if (symb.toString() === 'Symbol(touched)') {
      touchedProp = symb
    }
  })

  if (!touchedProp) {
    return
  }

  for (let prop in holidingPen[touchedProp]) {
    holidingPen[touchedProp][prop] = false
  }
  stateUpdated()
}

let waitingAlready = false

function debounce (func) {
  if (!waitingAlready) {
    waitingAlready = true
    nextTick(() => {
      func()
      waitingAlready = false
    })
  }
}

function nextTick(func) {
  typeof window === 'undefined' ? setTimeout(func, 17) : requestAnimationFrame(func)
}

function stateUpdated () {
  rootEl && update(rootEl, components(state))
}

function updateState (updateObject, options) {
  if (updateObject) {
    if (options && options.deepMerge === false) {
      Object.assign(state, updateObject)
    } else {
      let deepMergeOptions = {clone: false}
      if (options && options.arrayMerge === false) {
        deepMergeOptions.arrayMerge = (destinationArray, sourceArray, options) => {
          //don't merge arrays, just return the new one
          return sourceArray
        }
      }
      Object.assign(state, merge(state, updateObject, deepMergeOptions))
    }
  }

  debounce(stateUpdated)

  if (process.env.NODE_ENV !== 'production') {
    console.log('------STATE UPDATE------')
    console.log(updateObject)
    console.log('  ')
    console.log('------NEW STATE------')
    console.log(state)
    console.log('  ')

  }
}

function emptySSRVideos (c) {
  //SSR videos with source tags don't like morphing and you get double audio,
  // so remove src from the new one so it never starts
  let autoplayTrue = c.querySelectorAll('video[autoplay="true"]')
  let autoplayAutoplay = c.querySelectorAll('video[autoplay="autoplay"]')
  let autoplayOn = c.querySelectorAll('video[autoplay="on"]')
  let selectors = [autoplayTrue, autoplayAutoplay, autoplayOn]
  selectors.forEach(selector => {
    Array.from(selector).forEach(video => {
      video.pause()
      Array.from(video.childNodes).forEach(source => {
        source.src && (source.src = '')
      })
    })
  })
}

function injectHTML (htmlString, options) {
  if (options && options.wrapper === false) {
    return html([htmlString])
  }
  return html([`<div>${htmlString}</div>`]) // using html as a regular function instead of a tag function, and prevent double encoding of ampersands while we're at it
}

function injectMarkdown (mdString, options) {
  return injectHTML(entities.decode(marked(mdString)), options) //using html as a regular function instead of a tag function, and prevent double encoding of ampersands while we're at it
}

function cache (c, args) {
  if (typeof window === 'undefined') {
    return c(args)
  }

  let key = c.toString() + toSource(args)

  if (!componentRegistry.has(key)) {

    //not already in the registry, add it
    let el = c(args)
    componentRegistry.set(key, el)
    return el
  } else {
    return componentRegistry.get(key)
  }

}

function gotoRoute (route) {
  let {pathname, hash, search, href} = createLocation({}, route)
  //if pathname doesn't begin with a /, add one
  if (pathname && pathname.indexOf('/') !== 0) {
    pathname = `/${pathname}`
  }
  let component = router(route, {pathname, hash, search, href})
  updateState({
    router: {
      component
    }
  })
}

function getRouteComponent (pathname) {
  let foundRoute = routesArray.find(route => route.key === pathname || route.path === pathname)
  return foundRoute && foundRoute.component
}

function getSymbol(ob, symbolName){
  let symbols = Object.getOwnPropertySymbols(ob)
  if (symbols.length) {
    return symbols.find(symb => symb.toString().includes(`Symbol(${symbolName})`))
  }
}

function addToHoldingPen(holdingPen, addition){
  let currentValid = holdingPen[getSymbol(holdingPen, 'valid')]
  let currentTouched = holdingPen[getSymbol(holdingPen, 'touched')]
  let additionValid = addition[getSymbol(addition, 'valid')]
  let additionTouched = addition[getSymbol(addition, 'touched')]
  let additionWithoutSymbols = {}
  Object.keys(addition).forEach(ad => {
    additionWithoutSymbols[ad] = addition[ad]
  })
  Object.assign(currentValid, additionValid)
  Object.assign(currentTouched, additionTouched)
  Object.assign(holdingPen, additionWithoutSymbols)
}

function removeFromHoldingPen(holdingPen, removal){
  let currentValid = holdingPen[getSymbol(holdingPen, 'valid')]
  let currentTouched = holdingPen[getSymbol(holdingPen, 'touched')]
  removal.forEach(key => {
    delete currentValid[key]
    delete currentTouched[key]
    delete holdingPen[key]
  })
}

export default (config, {shiftyRouter = shiftyRouterModule, href = hrefModule, history = historyModule} = {}) => {
  //this default function is used for setting up client side and is not run on
  // the server
  ({components, el} = config)

  return new Promise((resolve, reject) => {
    let routesFormatted = routesArray.map(r => [
      r.path,
      (params, parts) => {

        r.callback && r.callback(Object.assign({}, parts, {params}))
        if (parts && window.location.pathname !== parts.pathname) {
          window.history.pushState({href: parts.href}, r.title, parts.href)
        }

        updateState({
          router: {
            pathname: parts.pathname,
            hash: parts.hash,
            query: qs.parse(parts.search),
            params,
            key: r.key || r.path,
            href: location.href
          }
        }, {
          deepMerge: false
        })

        document.title = r.title || ''

        return r.component

      }

    ])

    router = shiftyRouter({default: '/404'}, routesFormatted)

    href(location => {
      if (externalRoutes.includes(location.pathname)) {
        window.location = location.pathname
        return
      }

      gotoRoute(location.href)
    })

    history(location => {
      gotoRoute(location.href)
    })

    let c = components(state)//root element generated by components
    if (el) {

      emptySSRVideos(c)

      let r = document.querySelector(el)
      rootEl = update(r, c)
      return resolve({rootEl, state})
    }
    rootEl = c
    resolve({rootEl, state})//if no root element provided, just return the root
    // component and the state
  })
}

export {
  getRouteComponent,
  cache,
  stateUpdated as rerender,
  formIsValid,
  ssr,
  injectHTML,
  injectMarkdown,
  geb,
  eventEmitter,
  html,
  defineRoute,
  updateState,
  formField,
  gotoRoute,
  cssTag as css,
  axios as http,
  fieldIsTouched,
  resetTouched,
  nextTick,
  addToHoldingPen,
  removeFromHoldingPen
}