import observer from '@nx-js/observer-util';
import sheetRouter from 'sheet-router';
import href from 'sheet-router/href';
import html, {update} from 'yo-yo';
import { get } from 'axios';
var routesArray = [];
var baseApiPath = '';
var store = { NOTICE: 'Store object within halfcab should not be used server-side. It\'s only for client-side.' };



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
    //this default function is used for setting up client side and is not run on the server
    store = observer.observable({});
    baseApiPath = config.baseApiPath || '';
    observer.observe(() => update(config.rootComponent, config.components()));

    var routesFormatted = routesArray.map(r => [
        r.path,
        (params) =>{

            //get data that the route needs first
            get(`${baseApiPath}${config.path}`)
                .then(data => {
                    config.data = data.data;
                    r.callback(params);
                    update(config.rootComponent, config.components(store));
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
        html,
        route,
        store,
        emptyBody,
        formField
    }
}


export {html, route, store, emptyBody, formField};