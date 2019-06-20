import eeModule from 'event-emitter'

export default function ({ee = eeModule, state = {}} = {}) {

  var events = ee({})
  var noop = () => {}

  if (typeof window !== 'undefined') {
    function broadcast (eventName, eventObject) {

      //Set a break point on the following line to monitor all events being broadcast
      console.log('Event broadcast: ' + eventName)
      events.emit(eventName, eventObject, state)
    }

    function on (eventName, cb) {
      //Set a break point on the following line to monitor all events being listened to
      events.on(eventName, cb)
    }

    function once (eventName, cb) {

      //Set a break point on the following line to monitor all events being listened to just once
      events.once(eventName, cb)
    }

    function off (eventName, listenerFunction) {

      //Set a break point on the following line to monitor all events being unlistened to
      events.off(eventName, listenerFunction)
    }

    return {
      broadcast,
      on,
      once,
      off
    }
  } else {
    return {
      broadcast: noop,
      on: noop,
      once: noop,
      off: noop
    }
  }

}
