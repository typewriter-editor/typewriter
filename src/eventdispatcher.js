const dispatcherEvents = new WeakMap();


export default class EventDispatcher {

  on(type, listener) {
    getEventListeners(this, type).add(listener);
  }

  off(type, listener) {
    getEventListeners(this, type).delete(listener);
  }

  once(type, listener) {
    function once(...args) {
      this.off(type, once);
      listener.apply(this, args);
    }
    this.on(type, once);
  }

  fire(type, ...args) {
    let uncanceled = true;
    getEventListeners(this, type).forEach(listener => {
      uncanceled && listener.apply(this, args) !== false || (uncanceled = false);
    });
    return uncanceled;
  }
}


function getEventListeners(obj, type) {
  let events = dispatcherEvents.get(obj);
  if (!events) dispatcherEvents.set(obj, events = Object.create(null));
  return events[type] || (events[type] = new Set());
}
