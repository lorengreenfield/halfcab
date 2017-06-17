import observer from '@nx-js/observer-util';
import sheetRouter from 'sheet-router';
import href from 'sheet-router/href';
import history from 'sheet-router/history';
import html, {update} from 'yo-yo';
import { get } from 'axios';
import nextTick from 'next-tick';
import css from 'csjs-inject';

var cssTag = css;
var componentCSSString = '';
var routesArray = [];
var baseApiPath = '';
var store = { NOTICE: 'The store object within halfcab should not be used server-side. It\'s only for client-side.' };
var router;
var rawDataObject = {};

if(typeof window !== 'undefined'){
    var routerObject = {router: {pathname: window.location.pathname}};
    store = observer.observable(rawDataObject, window.initialData ? Object.assign(rawDataObject, window.initialData, routerObject): routerObject);
}else{

    cssTag = function(cssString){
        var output = css(cssString);
        componentCSSString += output[' css '];
        return output;
    }
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
        startPromise = get(`${baseApiPath}${r.path}`)
    }
    return startPromise
        .then(data => {
            r.callback({apiData: data.data, params});
            if(window.location.pathname !== r.path){
                window.history.pushState({path: r.path}, r.title, r.path);
            }
            store.router.pathname = r.path;
            document.title = r.path !== '' && r.title ? `${config.baseName} - ${r.title}`: config.baseName;
        })
        .catch(err => {
            console.log(err.toString());
        });
}

var isClient = false;
if(typeof window !== 'undefined'){
    isClient = true;
}

export default function (config){
    //this default function is used for setting up client side and is not run on the server
    var { components } = config;
    return new Promise((resolve, reject) => {

        var routesFormatted = routesArray.map(r => [
            r.path,
            (params) =>{

                getApiData(config, r, params);

            }

        ]);

        router = sheetRouter({default: '/404'}, routesFormatted);

        href((location) =>{
            router(location.pathname);
        });

        history((location) => {
            router(location.pathname);
        });

        getApiData(config, { skipApiCall: !!window.initialData, path: location.pathname, callback: (output) => {
            Object.assign(store, output.apiData);
        }}).then(()=>{
            nextTick(() => {
                var startComponent = components(store);
                observer.observe(() => {
                    if(process.env.NODE_ENV !== 'production'){
                        console.log(store.$raw);
                    }
                    update(startComponent, components(store))
                });
                resolve(startComponent);//initial component
            });
        })
    });
}

var cd = {};//empty object for storing client dependencies (or mocks or them on the server)

export {componentCSS, cd, html, route, store, emptyBody, formField, router, isClient, cssTag as css};