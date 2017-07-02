'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sheetRouter = _interopDefault(require('sheet-router'));
var href = _interopDefault(require('sheet-router/href'));
var history = _interopDefault(require('sheet-router/history'));
var html = require('yo-yo');
var html__default = _interopDefault(html);
var axios = require('axios');
var axios__default = _interopDefault(axios);
var cssInject = _interopDefault(require('csjs-inject'));
var merge = _interopDefault(require('deepmerge'));
var ee = _interopDefault(require('event-emitter'));

var events = ee({});

function eventEmitter(){

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
}

var eventEmitter$1 = new eventEmitter();

exports.css = cssInject;
var componentCSSString = '';
var routesArray = [];
var baseApiPath = '';
var maxStates = 50;
var states = [];
var rootEl;
var components;

if(typeof window !== 'undefined'){
    var routerObject = {router: {pathname: window.location.pathname}};
    var dataInitial = document.querySelector('[data-initial]');
    if(!!dataInitial){
        states[0] = (dataInitial && dataInitial.dataset.initial) && Object.assign({}, JSON.parse(atob(dataInitial.dataset.initial)), routerObject);
    }
}else{

    exports.css = (cssStrings, ...values) => {
        var output = cssInject(cssStrings, ...values);
        componentCSSString += componentCSSString.indexOf(output[' css ']) === -1 ? output[' css '] : '';
        return output;
    };
}

function ssr(rootComponent){
    var componentsString = `${rootComponent}`;
    return { componentsString, stylesString: componentCSSString };
}

function route(routeObject, callback){
    routesArray.push(Object.assign(routeObject, {callback}));
}

function emptyBody(){
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
}

function formField(ob, prop){

    return e => {
        ob[prop] = e.currentTarget.value;
    }
}

function getLatestState(){
    return states[states.length-1];
}

function setMaxStates(num){
    maxStates = num;
}

function updateState(updateObject, options){

    if(options && options.deepMerge){
        states.push(Object.assign({}, merge(getLatestState(), updateObject)));
    }else{
        states.push(Object.assign({}, getLatestState(), updateObject));
    }
    if(states.length > maxStates){
        states.shift();
    }
    rootEl && html.update(rootEl, components(getLatestState()), {
        //morphdom options
        onBeforeElUpdated: (fromEl, toEl) => {

            //copy across mdc-web object to keep element updated
            fromEl.dataset.mdcAutoInit && (toEl[fromEl.dataset.mdcAutoInit] = fromEl[fromEl.dataset.mdcAutoInit]);
            //if we return false, the element will not be updated
        }
    });

    if(process.env.NODE_ENV !== 'production'){
        console.log('------STATE UPDATE------');
        console.log(updateObject);
        console.log('  ');
        console.log('------NEW STATE------');
        console.log(getLatestState());
        console.log('  ');

    }
    return getLatestState();
}

function getApiData(config, r, params){
    //get data that the route needs first
    baseApiPath = config.baseApiPath || '';
    var startPromise;
    if(r.skipApiCall){

        startPromise = Promise.resolve({data: { data: null }});
    }else{
        startPromise = axios.get(`${baseApiPath}${r.path}`);
    }
    return startPromise
        .then(data => {
            r.callback({apiData: data.data, params});
            if(window.location.pathname !== r.path){
                window.history.pushState({path: r.path}, r.title, r.path);
            }

            updateState({
                router: {
                    pathname: r.path
                }
            }, {
                deepMerge: true
            });

            document.title = r.path !== '' && r.title ? `${config.baseName} - ${r.title}`: config.baseName;
        })
        .catch(err => {
            console.log(err.toString());
        });
}

function injectHTML(htmlString){
    return html__default(htmlString);//using html as a regular function instead of a tag function
}

var halfcab = function (config){
    //this default function is used for setting up client side and is not run on the server
    components = config.components;
    config.maxStates && setMaxStates(config.maxStates);
    return new Promise((resolve, reject) => {

        var routesFormatted = routesArray.map(r => [
            r.path,
            (params) =>{

                getApiData(config, r, params);

            }

        ]);

        exports.router = sheetRouter({default: '/404'}, routesFormatted);

        href((location) =>{
            exports.router(location.pathname);
        });

        history((location) => {
            exports.router(location.pathname);
        });

        getApiData(config, { skipApiCall: !!dataInitial, path: location.pathname, callback: (output) => {
            output.apiData.data && updateState(output.apiData);
        }}).then(()=>{

            rootEl = components(getLatestState());
            resolve(rootEl);//root element generated by components
        });
    });
};

var cd = {};//empty object for storing client dependencies (or mocks or them on the server)

exports['default'] = halfcab;
exports.ssr = ssr;
exports.injectHTML = injectHTML;
exports.states = states;
exports.geb = eventEmitter$1;
exports.eventEmitter = eventEmitter;
exports.cd = cd;
exports.html = html__default;
exports.route = route;
exports.updateState = updateState;
exports.emptyBody = emptyBody;
exports.formField = formField;
exports.http = axios__default;
