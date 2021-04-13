type Events = {[type: string]: Set<EventListener>};
type OnceEvents = {[type: string]: Map<EventListener,EventListener>};
const dispatcherEvents = new WeakMap<EventDispatcher, Events>();
const onceListeners = new WeakMap<EventDispatcher, OnceEvents>();

export default class EventDispatcher {

  on(type: string, listener: EventListener, options?: AddEventListenerOptions) {
    this.addEventListener(type, listener, options);
  }

  off(type: string, listener: EventListener, options?: AddEventListenerOptions) {
    this.removeEventListener(type, listener, options);
  }

  addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions) {
    if (options?.once) listener = getOnceListener(this, type, listener, true);
    getEventListeners(this, type, true).add(listener);
  }

  removeEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions) {
    if (options?.once) listener = getOnceListener(this, type, listener) as EventListener;
    if (!listener) return;
    const events = getEventListeners(this, type);
    events && events.delete(listener);
  }

  dispatchEvent(event: Event, catchErrors?: boolean) {
    const events = getEventListeners(this, event.type);
    if (!events) return;
    for (let listener of events) {
      if (catchErrors) {
        try {
          listener.call(this, event);
        } catch (err) {
          try {
            this.dispatchEvent(new ErrorEvent('error', { error: err }));
          } catch (err) {}
        }
      } else {
        listener.call(this, event);
      }
      if (event.cancelBubble) break;
    }
  }
}


function getEventListeners(obj: EventDispatcher, type: string, autocreate = false) {
  let events = dispatcherEvents.get(obj) as Events;
  if (!events && autocreate) dispatcherEvents.set(obj, events = Object.create(null));
  return events && events[type] || autocreate && (events[type] = new Set());
}

function getOnceListener(obj: EventDispatcher, type: string, listener: EventListener, autocreate = false): EventListener {
  let events = onceListeners.get(obj) as OnceEvents;
  if (!events && autocreate) dispatcherEvents.set(obj, events = Object.create(null));
  const map = events && events[type] || autocreate && (events[type] = new Map());
  if (!map.has(listener) && autocreate) {
    const wrapper = event => {
      const events = getEventListeners(obj, type);
      events && events.delete(listener);
      listener.call(obj, event);
    }
    map.set(listener, wrapper);
  }
  return map && map.get(listener) as EventListener;
}
