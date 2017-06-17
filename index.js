'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var observer = _interopDefault(require('@nx-js/observer-util'));
var sheetRouter = _interopDefault(require('sheet-router'));
var href = _interopDefault(require('sheet-router/href'));
var history = _interopDefault(require('sheet-router/history'));
var yoYo = require('yo-yo');
var yoYo__default = _interopDefault(yoYo);
var axios = require('axios');
var nextTick = _interopDefault(require('next-tick'));
var css = _interopDefault(require('csjs-inject'));

exports.css = css;
var componentCSSString = '';
var routesArray = [];
var baseApiPath = '';
exports.store = { NOTICE: 'The store object within halfcab should not be used server-side. It\'s only for client-side.' };
var rawDataObject = {};

if(typeof window !== 'undefined'){
    var routerObject = {router: {pathname: window.location.pathname}};
    exports.store = observer.observable(rawDataObject, window.initialData ? Object.assign(rawDataObject, window.initialData, routerObject): routerObject);
}else{

    exports.css = function(cssString){
        var output = css(cssString);
        componentCSSString += output[' css '];
        return output;
    };
}

function componentCSS(){
    return componentCSSString;
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

    return function(e){
        ob[prop] = e.currentTarget.value;
    }
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
            exports.store.router.pathname = r.path;
            document.title = r.path !== '' && r.title ? `${config.baseName} - ${r.title}`: config.baseName;
        })
        .catch(err => {
            console.log(err.toString());
        });
}

exports.isClient = false;
if(typeof window !== 'undefined'){
    exports.isClient = true;
}

var index = function (config){
    //this default function is used for setting up client side and is not run on the server
    var { components } = config;
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

        getApiData(config, { skipApiCall: !!window.initialData, path: location.pathname, callback: (output) => {
            Object.assign(exports.store, output.apiData);
        }}).then(()=>{
            nextTick(() => {
                var startComponent = components(exports.store);
                observer.observe(() => {
                    if(process.env.NODE_ENV !== 'production'){
                        console.log(exports.store.$raw);
                    }
                    yoYo.update(startComponent, components(exports.store));
                });
                resolve(startComponent);//initial component
            });
        });
    });
};

var cd = {};//empty object for storing client dependencies (or mocks or them on the server)

exports['default'] = index;
exports.componentCSS = componentCSS;
exports.cd = cd;
exports.html = yoYo__default;
exports.route = route;
exports.emptyBody = emptyBody;
exports.formField = formField;
