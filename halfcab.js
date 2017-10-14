import sheetRouter from 'sheet-router'
import href from 'sheet-router/href'
import history from 'sheet-router/history'
import createLocation from 'sheet-router/create-location'
import html from 'bel'
import update from 'nanomorph'
import axios, { get } from 'axios'
import cssInject from 'csjs-inject'
import merge from 'deepmerge'
import marked from 'marked'
import { AllHtmlEntities } from 'html-entities'
import geb, { eventEmitter } from './eventEmitter/index.js'
import qs from 'qs'
import deepFreeze from 'deep-freeze'

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

marked.setOptions({
    breaks: true
})

if(typeof window !== 'undefined'){
    componentRegistry = new Map()
    dataInitial = document.querySelector('[data-initial]')
    if(!!dataInitial){
        state = (dataInitial && dataInitial.dataset.initial) && Object.assign({}, JSON.parse(atob(dataInitial.dataset.initial)))

        if(!state.router){
            state.router = {}
        }

        if(!state.router.pathname){
            Object.assign(state.router, {pathname: window.location.pathname, hash: window.location.hash, query: qs.parse(window.location.search)})
        }

        //encourage state updates with updateState instead of direct access to state, by making state object immutable

    }
    deepFreeze(state)
}else{

    cssTag = (cssStrings, ...values) => {
        let output = cssInject(cssStrings, ...values)
        componentCSSString += componentCSSString.indexOf(output[' css ']) === -1 ? output[' css '] : ''
        return output
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
            state = Object.assign({}, state, updateObject)
        }else{
            state = merge(Object.assign({}, state), updateObject)
        }
        deepFreeze(state)
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

function injectHTML(htmlString){
    return html([`<div>${htmlString}</div>`])//using html as a regular function instead of a tag function, and prevent double encoding of ampersands while we're at it
}

function injectMarkdown(mdString){
    return injectHTML(entities.decode(marked(mdString)))//using html as a regular function instead of a tag function, and prevent double encoding of ampersands while we're at it
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
    components = config.components
    postUpdate = config.postUpdate
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

        router = sheetRouter({default: '/404'}, routesFormatted)

        href(location =>{
            gotoRoute(location.href)
        })

        history(location => {
            gotoRoute(location.href)
        })

        rootEl = components(state)
        resolve(rootEl)//root element generated by components
    })
}

let cd = {}//empty object for storing client dependencies (or mocks or them on the server)

export {getRouteComponent, cache, formIsValid, ssr, injectHTML, injectMarkdown, state, geb, eventEmitter, cd, html, defineRoute, updateState, emptyBody, formField, gotoRoute, cssTag as css, axios as http}