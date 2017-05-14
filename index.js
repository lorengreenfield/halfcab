'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var observer = _interopDefault(require('@nx-js/observer-util'));
var sheetRouter = _interopDefault(require('sheet-router'));
var href = _interopDefault(require('sheet-router/href'));
var html = require('yo-yo');
var html__default = _interopDefault(html);
var axios = require('axios');

var routesArray = [];
var baseApiPath = '';
exports.store = { NOTICE: 'Store object within halfcab should not be used server-side. It\'s only for client-side.' };



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


var index = function (config){
    //this default function is used for setting up client side and is not run on the server
    exports.store = observer.observable({});
    baseApiPath = config.baseApiPath || '';
    observer.observe(() => html.update(config.rootComponent, config.components()));

    var routesFormatted = routesArray.map(r => [
        r.path,
        (params) =>{

            //get data that the route needs first
            axios.get(`${baseApiPath}${config.path}`)
                .then(data => {
                    config.data = data.data;
                    r.callback(params);
                    html.update(config.rootComponent, config.components(exports.store));
                    if(window.location.pathname !== r.path){
                        window.history.pushState({path: r.path}, r.title, r.path);
                        document.title = r.path !== '' ? `${config.baseName} - ${r.title}`: config.baseName;
                    }
                })
                .catch(err => {
                    console.log(err.toString());
                });
        }

    ]);

    var router = sheetRouter({default: '/404'}, routesFormatted);

    href((link) =>{
        router(link.pathname);
    });

    window.onpopstate = function(event) {
        router(event.state && event.state.route || '/');
    };

    return {
        html: html__default,
        route,
        store: exports.store,
        emptyBody,
        formField
    }
};

exports['default'] = index;
exports.html = html__default;
exports.route = route;
exports.emptyBody = emptyBody;
exports.formField = formField;
