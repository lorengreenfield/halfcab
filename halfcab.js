import shiftyRouter from 'shifty-router'
import href from 'shifty-router/href'
import history from 'shifty-router/history'
import createLocation from 'shifty-router/create-location'
import bel from 'bel'
import update from 'nanomorph'
import axios, { get } from 'axios'
import cssInject from 'csjs-inject'
import merge from 'deepmerge'
import marked from 'marked'
import { AllHtmlEntities } from 'html-entities'
import geb, { eventEmitter } from './eventEmitter/index.js'
import qs from 'qs'

let componentRegistry
let entities = new AllHtmlEntities()
let cssTag = cssInject
let componentCSSString = ''
let routesArray = []
let state = {}
let router
let rootEl
let components
let postUpdate
let dataInitial
let el

marked.setOptions({
    breaks: true
})

function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

if(typeof window !== 'undefined'){
    componentRegistry = new Map()
    dataInitial = document.querySelector('[data-initial]')
    if(!!dataInitial){
        state = (dataInitial && dataInitial.dataset.initial) && Object.assign({}, JSON.parse(b64DecodeUnicode(dataInitial.dataset.initial)))

        if(!state.router){
            state.router = {}
        }

        if(!state.router.pathname){
            Object.assign(state.router, {pathname: window.location.pathname, hash: window.location.hash, query: qs.parse(window.location.search)})
        }
    }
}else{

    cssTag = (cssStrings, ...values) => {
        let output = cssInject(cssStrings, ...values)
        componentCSSString += componentCSSString.indexOf(output[' css ']) === -1 ? output[' css '] : ''
        return output
    }
}

let html = (strings, ...values) => {

    //check for attributes that we're setting without values (flags like disabled, loop, required, etc)
    let unfrozenStrings = strings.slice(0)
    values.forEach((value, index) => {
        if(typeof value === 'object' && value.type && value.type === 'attribute'){
            //remove this item from the values array and put it in the strings array
            let swap = values.splice(index, 1)
            let joiners = unfrozenStrings.splice(index, 2).join(` ${swap[0].value} `)
            unfrozenStrings.splice(index, 0, joiners)
        }
    })
    return bel(unfrozenStrings, ...values)
}

function attribute(str){

    if(!str){
        return str
    }

    return {
        type: 'attribute',
        value: str
    }
}

function ssr(rootComponent){
    let componentsString = `${rootComponent}`
    return { componentsString, stylesString: componentCSSString }
}

function defineRoute(routeObject){
    routesArray.push(routeObject)
}

function emptyBody(){
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild)
    }
}

function formField(ob, prop){

    return e => {
        ob[prop] = e.currentTarget.type === 'checkbox' || e.currentTarget.type === 'radio' ? e.currentTarget.checked : e.currentTarget.value
        let validOb
        if(!ob.valid){
            if(Object.getOwnPropertySymbols(ob).length > 0){
                Object.getOwnPropertySymbols(ob).forEach(symb => {
                    if(symb.toString() === 'Symbol(valid)'){
                        validOb = symb
                    }
                })
            }else{
                ob.valid = {}
                validOb = 'valid'
            }

        }else{
            validOb = 'valid'
        }
        ob[validOb][prop] = e.currentTarget.validity.valid
        console.log('---formField update---')
        console.log(prop, ob)
        console.log(`Valid? ${ob[validOb][prop]}`)
    }
}

function formIsValid(holidingPen){
    let validProp = holidingPen.valid && 'valid'
    if(!validProp){
        Object.getOwnPropertySymbols(holidingPen).forEach(symb => {
            if(symb.toString() === 'Symbol(valid)'){
                validProp = symb
            }
        })

        if(!validProp){
            return false
        }
    }

    let validOb = Object.keys(holidingPen[validProp])

    for(let i = 0; i < validOb.length; i ++){
        if(holidingPen[validProp][validOb[i]] !== true){
            return false
        }
    }

    return true
}

let waitingAlready = false
function debounce(func) {
    if(!waitingAlready){
        waitingAlready = true
        requestAnimationFrame(() => {
            func()
            waitingAlready = false
        })
    }
}

function stateUpdated(){
    rootEl && update(rootEl, components(state))
    postUpdate && postUpdate()
}

function updateState(updateObject, options){

    if(updateObject){
        if(options && options.deepMerge === false){
            Object.assign(state, updateObject)
        }else{
            let deepMergeOptions = {}
            if(options && options.arrayMerge === false){
                deepMergeOptions.arrayMerge = (destinationArray, sourceArray, options) => {
                    //don't merge arrays, just return the new one
                    return sourceArray
                }
            }
            Object.assign(state, merge(state, updateObject, deepMergeOptions))
        }
    }

    debounce(stateUpdated)


    if(process.env.NODE_ENV !== 'production'){
        console.log('------STATE UPDATE------')
        console.log(updateObject)
        console.log('  ')
        console.log('------NEW STATE------')
        console.log(state)
        console.log('  ')

    }
}

function injectHTML(htmlString, options){
    if(options && options.wrapper === false){
        return html([htmlString])
    }
    return html([`<div>${htmlString}</div>`])//using html as a regular function instead of a tag function, and prevent double encoding of ampersands while we're at it
}

function injectMarkdown(mdString, options){
    return injectHTML(entities.decode(marked(mdString)), options)//using html as a regular function instead of a tag function, and prevent double encoding of ampersands while we're at it
}

function cache(c, args){

    if(typeof window === 'undefined'){
        return c(args)
    }

    let key = c.toString() + JSON.stringify(args)

    if(!componentRegistry.has(key)){

        //not already in the registry, add it
        let el = c(args)
        componentRegistry.set(key, el)
        return el
    }else{
        return componentRegistry.get(key)
    }

}

function gotoRoute(route){
    let { pathname, hash, search, href } = createLocation({}, route)
    //if pathname doesn't begin with a /, add one
    if(pathname && pathname.indexOf('/') !== 0){
        pathname = `/${pathname}`
    }
    let component = router(route, { pathname, hash, search, href })
    updateState({
        router: {
            component
        }
    })
}

function getRouteComponent(pathname){
    let foundRoute = routesArray.find(route => route.key === pathname || route.path === pathname)
    return foundRoute && foundRoute.component
}


export default function (config){
    //this default function is used for setting up client side and is not run on the server
    ({components, postUpdate, el} = config)

    return new Promise((resolve, reject) => {

        let routesFormatted = routesArray.map(r => [
            r.path,
            (params, parts) =>{

                r.callback && r.callback(Object.assign({}, parts, {params}))
                if(parts && window.location.pathname !== parts.pathname){
                    window.history.pushState({href: parts.href}, r.title, parts.href)
                }

                updateState({
                    router: {
                        pathname: parts.pathname,
                        hash: parts.hash,
                        query: qs.parse(parts.search),
                        params,
                        key: r.key || r.path
                    }
                }, {
                    deepMerge: false
                })

                document.title = parts.pathname !== '' && r.title ? `${config.baseName} - ${r.title}`: config.baseName

                return r.component

            }

        ])

        router = shiftyRouter({default: '/404'}, routesFormatted)

        href(location =>{
            gotoRoute(location.href)
        })

        history(location => {
            gotoRoute(location.href)
        })

        let c = components(state)//root element generated by components
        if(el){
            let r = document.querySelector(el)
            rootEl = update(r, c)
            return resolve(rootEl)
        }
        rootEl = c
        resolve(rootEl)//if no root element provided, just return the root component
    })
}


let cd = {}//empty object for storing client dependencies (or mocks or them on the server)
export {attribute, state, getRouteComponent, cache, stateUpdated as rerender, formIsValid, ssr, injectHTML, injectMarkdown, geb, eventEmitter, cd, html, defineRoute, updateState, emptyBody, formField, gotoRoute, cssTag as css, axios as http}