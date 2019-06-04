const dispatcherEvents = new WeakMap();


export default class EventDispatcher {

  on(type: string, listener: Function) {
    getEventListeners(this, type, true).add(listener);
  }

  off(type: string, listener: Function) {
    const events = getEventListeners(this, type);
    events && events.delete(listener);
  }

  once(type: string, listener: Function) {
    const once = (...args) => {
      this.off(type, once);
      listener.apply(this, args);
    }
    this.on(type, once);
  }

  fire(type: string, ...args: any[]) {
    let uncanceled = true;
    const events = getEventListeners(this, type);
    if (events) events.forEach(listener => {
      uncanceled && listener.apply(this, args) !== false || (uncanceled = false);
    });
    return uncanceled;
  }
}


function getEventListeners(obj: EventDispatcher, type: string, autocreate = false) {
  let events = dispatcherEvents.get(obj);
  if (!events && autocreate) dispatcherEvents.set(obj, events = Object.create(null));
  return events && events[type] || autocreate && (events[type] = new Set());
}
