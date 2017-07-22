import sheetRouter from 'sheet-router'
import href from 'sheet-router/href'
import history from 'sheet-router/history'
import html from 'bel'
import update from 'mdc-nanomorph'
import axios, { get } from 'axios'
import cssInject from 'csjs-inject'
import merge from 'deepmerge'
import marked from 'marked'
import { AllHtmlEntities } from 'html-entities'
import geb, { eventEmitter } from './eventEmitter'

var componentRegistry
var entities = new AllHtmlEntities()
var cssTag = cssInject
var componentCSSString = ''
var routesArray = []
var baseApiPath = ''
var state = {}
var router
var rootEl
var components
var postUpdate

marked.setOptions({
    breaks: true
})

if(typeof window !== 'undefined'){
    componentRegistry = new Map()
    var routerObject = {router: {pathname: window.location.pathname}}
    var dataInitial = document.querySelector('[data-initial]')
    if(!!dataInitial){
        state = (dataInitial && dataInitial.dataset.initial) && Object.assign({}, JSON.parse(atob(dataInitial.dataset.initial)), routerObject)
    }
}else{

    cssTag = (cssStrings, ...values) => {
        var output = cssInject(cssStrings, ...values)
        componentCSSString += componentCSSString.indexOf(output[' css ']) === -1 ? output[' css '] : ''
        return output
    }
}

function ssr(rootComponent){
    var componentsString = `${rootComponent}`
    return { componentsString, stylesString: componentCSSString }
}

function route(routeObject, callback){
    routesArray.push(Object.assign(routeObject, {callback}))
}

function emptyBody(){
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild)
    }
}

function formField(ob, prop){

    return e => {
        ob[prop] = e.currentTarget.type === 'checkbox' || e.currentTarget.type === 'radio' ? e.currentTarget.checked : e.currentTarget.value

        if(!ob.valid){
            ob.valid = {}
        }
        ob.valid[prop] = e.currentTarget.validity.valid
        console.log('---formField update---')
        console.log(prop, ob)
        console.log(`Valid? ${ob.valid[prop]}`)
    }
}

function formValid(holidingPen){
    var validOb = Object.keys(holidingPen.valid);
    if(!validOb){
        return false
    }

    for(var i = 0; i < validOb.length; i ++){
        if(holidingPen.valid[validOb[i]] !== true){
            return false
        }
    }

    return true
}

var waitingAlready = false
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
            state = merge(state, updateObject)
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

function getApiData(config, r, params){
    //get data that the route needs first
    baseApiPath = config.baseApiPath || ''
    postUpdate = config.postUpdate
    var startPromise
    if(r.skipApiCall){

        startPromise = Promise.resolve({data: { data: null }})
    }else{
        startPromise = get(`${baseApiPath}${r.path}`)
    }
    return startPromise
        .then(data => {
            r.callback({apiData: data.data, params})
            if(window.location.pathname !== r.path){
                window.history.pushState({path: r.path}, r.title, r.path)
            }

            updateState({
                router: {
                    pathname: r.path
                }
            }, {
                deepMerge: true
            })

            document.title = r.path !== '' && r.title ? `${config.baseName} - ${r.title}`: config.baseName
        })
        .catch(err => {
            console.log(err.toString())
        })
}

function injectHTML(htmlString){
    return html([`<div>${htmlString}</div>`])//using html as a regular function instead of a tag function, and prevent double encoding of ampersands while we're at it
}

function injectMarkdown(mdString){
    return injectHTML(entities.decode(marked(mdString)))//using html as a regular function instead of a tag function, and prevent double encoding of ampersands while we're at it
}

function component(c, args){

    if(typeof window === 'undefined'){
        return c(args)
    }

    var key = c.toString() + JSON.stringify(args)

    if(!componentRegistry.has(key)){

        //not already in the registry, add it
        var el = c(args)
        componentRegistry.set(key, el)
        return el
    }else{
        return componentRegistry.get(key)
    }

}


export default function (config){
    //this default function is used for setting up client side and is not run on the server
    components = config.components
    return new Promise((resolve, reject) => {

        var routesFormatted = routesArray.map(r => [
            r.path,
            (params) =>{

                getApiData(config, r, params)

            }

        ])

        router = sheetRouter({default: '/404'}, routesFormatted)

        href((location) =>{
            router(location.pathname)
        })

        history((location) => {
            router(location.pathname)
        })

        getApiData(config, { skipApiCall: !!dataInitial, path: location.pathname, callback: (output) => {
            output.apiData.data && updateState(output.apiData)
        }}).then(()=>{

            rootEl = components(state)
            resolve(rootEl)//root element generated by components
        })
    })
}

var cd = {}//empty object for storing client dependencies (or mocks or them on the server)

export {component, formValid, ssr, injectHTML, injectMarkdown, state, geb, eventEmitter, cd, html, route, updateState, emptyBody, formField, router, cssTag as css, axios as http}