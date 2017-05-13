'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var observer = _interopDefault(require('@nx-js/observer-util'));
var sheetRouter = _interopDefault(require('sheet-router'));
var href = _interopDefault(require('sheet-router/href'));
var html = require('yo-yo');
var html__default = _interopDefault(html);

var routesArray = [];

var store = observer.observable({});

function routes(config){

    observer.observe(() => html.update(config.rootComponent, config.components()));

    var routesFormatted = routesArray.map(route => [
        route.path,
        (params) =>{
            route.callback(params);
            html.update(config.rootComponent, config.components());
            if(window.location.pathname !== route.path){
                window.history.pushState({path: route.path}, route.title, route.path);
                document.title = route.path !== '' ? `${config.baseName} - ${route.title}`: config.baseName;
            }
        }

    ]);

    var router = sheetRouter({default: '/404'}, routesFormatted);

    href((link) =>{
        router(link.pathname);
    });

    window.onpopstate = function(event) {
        router(event.state && event.state.route || '/');
    };

    return router;
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

var index = function(){
    return {
        html: html__default,
        routes,
        route,
        store,
        emptyBody,
        formField
    }
};

exports['default'] = index;
exports.html = html__default;
exports.routes = routes;
exports.route = route;
exports.store = store;
exports.emptyBody = emptyBody;
exports.formField = formField;
