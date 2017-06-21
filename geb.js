import eventEmitter from 'event-emitter';
var events = eventEmitter({});

function globalEventBus(){

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

export default new globalEventBus();
export { eventEmitter };