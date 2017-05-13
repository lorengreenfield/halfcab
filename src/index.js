import observer from '@nx-js/observer-util';
import sheetRouter from 'sheet-router';
import href from 'sheet-router/href';
import html, {update} from 'yo-yo';
import { get } from 'axios';
var routesArray = [];
var baseApiPath = '';
var store;



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


export default function (config){

    store = observer.observable(config.store || {});

    baseApiPath = config.baseApiPath || '';
    observer.observe(() => update(config.rootComponent, config.components()));

    var routesFormatted = routesArray.map(route => [
        route.path,
        (params) =>{

            //get data that the route needs first
            get(`${baseApiPath}${config.path}`)
                .then(data => {
                    config.data = data.data;
                    route.callback(params);
                    update(config.rootComponent, config.components());
                    if(window.location.pathname !== route.path){
                        window.history.pushState({path: route.path}, route.title, route.path);
                        document.title = route.path !== '' ? `${config.baseName} - ${route.title}`: config.baseName;
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
        html,
        route,
        store,
        emptyBody,
        formField
    }
}


export {html, route, store, emptyBody, formField};