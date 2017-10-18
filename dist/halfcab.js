'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sheetRouter = _interopDefault(require('sheet-router'));
var href = _interopDefault(require('sheet-router/href'));
var history = _interopDefault(require('sheet-router/history'));
var createLocation = _interopDefault(require('sheet-router/create-location'));
var html = _interopDefault(require('bel'));
var update = _interopDefault(require('nanomorph'));
var axios = require('axios');
var axios__default = _interopDefault(axios);
var cssInject = _interopDefault(require('csjs-inject'));
var merge = _interopDefault(require('deepmerge'));
var marked = _interopDefault(require('marked'));
var htmlEntities = require('html-entities');
var ee = _interopDefault(require('event-emitter'));
var qs = _interopDefault(require('qs'));
var deepFreeze = _interopDefault(require('deep-freeze'));

var events = ee({});

function eventEmitter(){

    var noop = () => {};

    if(typeof window !== 'undefined'){
        function broadcast(eventName, eventObject){

            //Set a break point on the following line to monitor all events being broadcast
            console.log('Event broadcast: '+ eventName);
            events.emit(eventName, eventObject);
        }

        function on(eventName, cb){

            //Set a break point on the following line to monitor all events being listened to
            events.on(eventName, cb);
        }

        function once(eventName, cb){

            //Set a break point on the following line to monitor all events being listened to just once
            events.once(eventName, cb);
        }

        function off(eventName, listenerFunction){

            //Set a break point on the following line to monitor all events being unlistened to
            events.off(eventName, listenerFunction);
        }

        return {
            broadcast: broadcast,
            on: on,
            once: once,
            off: off
        }
    }else{
        return {
            broadcast: noop,
            on: noop,
            once: noop,
            off: noop
        }
    }

}

var index = new eventEmitter();

let componentRegistry;
let entities = new htmlEntities.AllHtmlEntities();
exports.css = cssInject;
let componentCSSString = '';
let routesArray = [];
let state = {};
exports.state = {};
let router;
let rootEl;
let components;
let postUpdate;
let dataInitial;

marked.setOptions({
    breaks: true
});

if(typeof window !== 'undefined'){
    componentRegistry = new Map();
    dataInitial = document.querySelector('[data-initial]');
    if(!!dataInitial){
        state = (dataInitial && dataInitial.dataset.initial) && Object.assign({}, JSON.parse(atob(dataInitial.dataset.initial)));

        if(!state.router){
            state.router = {};
        }

        if(!state.router.pathname){
            Object.assign(state.router, {pathname: window.location.pathname, hash: window.location.hash, query: qs.parse(window.location.search)});
        }
    }
    freezeState();
}else{

    exports.css = (cssStrings, ...values) => {
        let output = cssInject(cssStrings, ...values);
        componentCSSString += componentCSSString.indexOf(output[' css ']) === -1 ? output[' css '] : '';
        return output
    };
}

function ssr(rootComponent){
    let componentsString = `${rootComponent}`;
    return { componentsString, stylesString: componentCSSString }
}

function defineRoute(routeObject){
    routesArray.push(routeObject);
}

function emptyBody(){
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
}

function formField(ob, prop){

    return e => {
        ob[prop] = e.currentTarget.type === 'checkbox' || e.currentTarget.type === 'radio' ? e.currentTarget.checked : e.currentTarget.value;
        let validOb;
        if(!ob.valid){
            if(Object.getOwnPropertySymbols(ob).length > 0){
                Object.getOwnPropertySymbols(ob).forEach(symb => {
                    if(symb.toString() === 'Symbol(valid)'){
                        validOb = symb;
                    }
                });
            }else{
                ob.valid = {};
                validOb = 'valid';
            }

        }else{
            validOb = 'valid';
        }
        ob[validOb][prop] = e.currentTarget.validity.valid;
        console.log('---formField update---');
        console.log(prop, ob);
        console.log(`Valid? ${ob[validOb][prop]}`);
    }
}

function formIsValid(holidingPen){
    let validProp = holidingPen.valid && 'valid';
    if(!validProp){
        Object.getOwnPropertySymbols(holidingPen).forEach(symb => {
            if(symb.toString() === 'Symbol(valid)'){
                validProp = symb;
            }
        });

        if(!validProp){
            return false
        }
    }

    let validOb = Object.keys(holidingPen[validProp]);

    for(let i = 0; i < validOb.length; i ++){
        if(holidingPen[validProp][validOb[i]] !== true){
            return false
        }
    }

    return true
}

let waitingAlready = false;
function debounce(func) {
    if(!waitingAlready){
        waitingAlready = true;
        requestAnimationFrame(() => {
            func();
            waitingAlready = false;
        });
    }
}

function stateUpdated(){
    rootEl && update(rootEl, components(state));
    postUpdate && postUpdate();
}

function freezeState(){
    exports.state = merge({}, state);//clone
    deepFreeze(exports.state);
}

function updateState(updateObject, options){

    if(updateObject){
        if(options && options.deepMerge === false){
            state = Object.assign({}, state, updateObject);
        }else{
            let deepMergeOptions = {};
            if(options && options.arrayMerge === false){
                deepMergeOptions.arrayMerge = (destinationArray, sourceArray, options) => {
                    //don't merge arrays, just return the new one
                    return sourceArray
                };
            }
            state = merge(Object.assign({}, state), updateObject, deepMergeOptions);

        }
        freezeState();
    }

    debounce(stateUpdated);


    if(process.env.NODE_ENV !== 'production'){
        console.log('------STATE UPDATE------');
        console.log(updateObject);
        console.log('  ');
        console.log('------NEW STATE------');
        console.log(state);
        console.log('  ');

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

    let key = c.toString() + JSON.stringify(args);

    if(!componentRegistry.has(key)){

        //not already in the registry, add it
        let el = c(args);
        componentRegistry.set(key, el);
        return el
    }else{
        return componentRegistry.get(key)
    }

}

function gotoRoute(route){
    let { pathname, hash, search, href: href$$1 } = createLocation({}, route);
    let component = router(route, { pathname, hash, search, href: href$$1 });
    updateState({
        router: {
            component
        }
    });
}

function getRouteComponent(pathname){
    let foundRoute = routesArray.find(route => route.key === pathname || route.path === pathname);
    return foundRoute && foundRoute.component
}


var halfcab = function (config){
    //this default function is used for setting up client side and is not run on the server
    components = config.components;
    postUpdate = config.postUpdate;
    return new Promise((resolve, reject) => {

        let routesFormatted = routesArray.map(r => [
            r.path,
            (params, parts) =>{

                r.callback && r.callback(Object.assign({}, parts, {params}));
                if(parts && window.location.pathname !== parts.pathname){
                    window.history.pushState({href: parts.href}, r.title, parts.href);
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
                });

                document.title = parts.pathname !== '' && r.title ? `${config.baseName} - ${r.title}`: config.baseName;

                return r.component

            }

        ]);

        router = sheetRouter({default: '/404'}, routesFormatted);

        href(location =>{
            gotoRoute(location.href);
        });

        history(location => {
            gotoRoute(location.href);
        });

        rootEl = components(state);
        resolve(rootEl);//root element generated by components
    })
};

let cd = {};//empty object for storing client dependencies (or mocks or them on the server)

exports['default'] = halfcab;
exports.getRouteComponent = getRouteComponent;
exports.cache = cache;
exports.rerender = stateUpdated;
exports.formIsValid = formIsValid;
exports.ssr = ssr;
exports.injectHTML = injectHTML;
exports.injectMarkdown = injectMarkdown;
exports.geb = index;
exports.eventEmitter = eventEmitter;
exports.cd = cd;
exports.html = html;
exports.defineRoute = defineRoute;
exports.updateState = updateState;
exports.emptyBody = emptyBody;
exports.formField = formField;
exports.gotoRoute = gotoRoute;
exports.http = axios__default;
