import observer from '@nx-js/observer-util';
import sheetRouter from 'sheet-router';
import href from 'sheet-router/href';
import html, {update} from 'yo-yo';
var routesArray = [];

var store = observer.observable({});

function routes(config){

    observer.observe(() => update(config.rootComponent, config.components()));

    var routesFormatted = routesArray.map(route => [
        route.path,
        (params) =>{
            route.callback(params);
            update(config.rootComponent, config.components());
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

export default function(){
    console.log('initiated halfcab');
    return {
        html,
        routes,
        route,
        store,
        emptyBody
    }
}

export {html, routes, route, store, emptyBody};