// Based off of https://github.com/jorgebucaran/superfine/ MIT licensed
export interface Props {
  [key: string]: any
}

export type VChild = VNode | string

export interface VNode {
  type: string
  props: Props
  children: VChild[]
  key: any
}

type Node = Element | Text;


const EMPTY_ARR = []
const SVG_NS = 'http://www.w3.org/2000/svg'
const domProps = new Set([ 'value', 'selected', 'checked', 'contentEditable' ])

const getKey = (vdom: VChild | Node) => (vdom == null ? vdom : (vdom as any).key)
const setKey = (dom: any, key?: string) => {
  if (key && key !== dom.key) dom.key = key
  if (!key && dom.key) delete dom.key
}

const listener = (event: Event) => {
  (event.currentTarget as any).events[event.type](event)
}

const patchProp = (dom: Element, key: string, oldVal: any, newVal: any, isSvg?: boolean) => {
  if (key === 'key') {
  } else if (key[0] === 'o' && key[1] === 'n') {
    if (!(((dom as any).events || ((dom as any).events = {}))[(key = key.slice(2))] = newVal)) {
      dom.removeEventListener(key, listener)
    } else if (!oldVal) {
      dom.addEventListener(key, listener)
    }
  } else if (newVal == null) {
    dom.removeAttribute(key)
  } else if (!isSvg && key !== 'list' && key !== 'form' && key in dom) {
    dom[key] = newVal == null ? '' : newVal
  } else {
    dom.setAttribute(key, newVal)
  }
}

const createNode = (vdom: VChild, isSvg?: boolean) => {
  if (typeof vdom === 'string') {
    return document.createTextNode(vdom);
  }
  var props = (vdom as VNode).props;
  var dom =
    (isSvg = (isSvg || vdom.type === 'svg'))
      ? document.createElementNS(SVG_NS, vdom.type, { is: props.is })
      : document.createElement(vdom.type, { is: props.is })

  for (var k in props) patchProp(dom as Element, k, null, props[k], isSvg)
  setKey(dom, getKey(vdom))

  vdom.children.forEach(kid => dom.appendChild(createNode(vdomify(kid), isSvg)))

  return dom
}

const getDomProps = (dom: Element, isSvg?: boolean): Props => {
  const props: Props = {}
  for (let i = 0; i < dom.attributes.length; i++) {
    const { name, value } = dom.attributes[i]
    if (name in dom && name !== 'list' && !isSvg) {
      props[name] = dom[name]
    } else {
      props[name] = value === '' ? true : value
    }
  }
  return props
}

const patchDom = (parent: Node, dom: Node, oldDom: Node | null, newVdom: VChild, isSvg?: boolean) => {
  if (typeof newVdom === 'string') {
    if (oldDom != null && oldDom.nodeType === Node.TEXT_NODE) {
      if (oldDom.nodeValue !== newVdom) dom.nodeValue = newVdom
    } else {
      dom = parent.insertBefore(createNode(newVdom, isSvg), dom)
      if (oldDom != null) {
        parent.removeChild(oldDom);
      }
    }
  } else if (oldDom == null || oldDom.nodeName.toLowerCase() !== (newVdom as VNode).type) {
    dom = parent.insertBefore(
      createNode(vdomify(newVdom), isSvg),
      dom
    )
    if (oldDom != null) {
      parent.removeChild(oldDom);
    }
  } else {
    var oldProps = getDomProps(oldDom as Element, isSvg),
      newProps = newVdom.props

    isSvg = isSvg || newVdom.type === 'svg'

    for (var i in { ...oldProps, ...newProps }) {
      if (
        (domProps.has(i)
          ? dom[i]
          : oldProps[i]) !== newProps[i]
      ) {
        patchProp(dom as Element, i, oldProps[i], newProps[i], isSvg)
      }
    }
    setKey(dom, newVdom.key)

    patchChildren(dom, newVdom.children, isSvg)
  }

  return dom
}

const patchChildren = (dom: Node, newVKids: VChild[], isSvg?: boolean, oldKids: Node[] = Array.from(dom.childNodes) as Node[]) => {
  var tmpKid: Node,
    oldKid: Node,
    oldKey: any,
    newKey: any,
    oldHead = 0,
    newHead = 0,
    oldTail = oldKids.length - 1,
    newTail = newVKids.length - 1

  // Patch children with the same key from the beginning until they diverge
  while (newHead <= newTail && oldHead <= oldTail) {
    if (
      (oldKey = getKey(oldKids[oldHead])) == null ||
      oldKey !== getKey(newVKids[newHead])
    ) {
      break
    }

    patchDom(
      dom,
      oldKids[oldHead],
      oldKids[oldHead++],
      (newVKids[newHead] = vdomify(newVKids[newHead++])),
      isSvg
    )
  }

  // Patch children with the same key backwards from the end until they diverge
  while (newHead <= newTail && oldHead <= oldTail) {
    if (
      (oldKey = getKey(oldKids[oldTail])) == null ||
      oldKey !== getKey(newVKids[newTail])
    ) {
      break
    }

    // Update the reference for insertBefore references
    oldKids[oldTail] = patchDom(
      dom,
      oldKids[oldTail],
      oldKids[oldTail--],
      (newVKids[newTail] = vdomify(newVKids[newTail--])),
      isSvg
    )
  }

  if (oldHead > oldTail) {
    // All old matched, so new nodes were inserted
    const insertBefore = oldKids[oldHead] || (oldKids[oldHead - 1] && oldKids[oldHead - 1].nextSibling || null);
    while (newHead <= newTail) {
      dom.insertBefore(
        createNode((newVKids[newHead] = vdomify(newVKids[newHead++])), isSvg),
        insertBefore
      )
    }
  } else if (newHead > newTail) {
    // All new matched, so extra old nodes needing to be removed
    while (oldHead <= oldTail) {
      dom.removeChild(oldKids[oldHead++]);
    }
  } else {
    // 1 or more from old and new need to be removed/added
    // cache old keys to their dom
    const oldKeyed = new Map<any, Node>();
    const newKeyed = new Set<any>()
    for (let i = oldHead; i <= oldTail; i++) {
      if ((oldKey = getKey(oldKids[i])) != null) {
        oldKeyed.set(oldKey, oldKids[i])
      }
    }

    // Go through the rest of the new to add/update them
    while (newHead <= newTail) {
      oldKey = getKey((oldKid = oldKids[oldHead]))
      newKey = getKey((newVKids[newHead] = vdomify(newVKids[newHead])))

      // If the old key was placed somewhere else already, or the new key is after this old one, remove it
      if (
        newKeyed.has(oldKey) ||
        (newKey != null && newKey === getKey(oldKids[oldHead + 1]))
      ) {
        if (oldKey == null) {
          dom.removeChild(oldKid)
        }
        oldHead++
        continue
      }

      if (newKey == null) {
        if (oldKey == null) {
          // Both keys are null, just patch it
          patchDom(
            dom,
            oldKid,
            oldKid,
            newVKids[newHead],
            isSvg
          )
          newHead++
        }
        // otherwise move on, we'll remove this old one below when we iterate through oldKeyed
        oldHead++
      } else {
        if (oldKey === newKey) {
          // They match, just patch them (incr newHead below)
          patchDom(dom, oldKid, oldKid, newVKids[newHead], isSvg)
          newKeyed.add(newKey)
          oldHead++
        } else {
          if ((tmpKid = oldKeyed.get(newKey) as Node) != null) {
            // If the matching old node is in the dom already, pull it into this location and patch it
            patchDom(
              dom,
              dom.insertBefore(tmpKid, oldKid),
              tmpKid,
              newVKids[newHead],
              isSvg
            )
            newKeyed.add(newKey)
          } else {
            // This is a new item and there is no old or the old no longer belongs, patch it in, leaving oldKid
            patchDom(
              dom,
              oldKid,
              null,
              newVKids[newHead],
              isSvg
            )
          }
        }
        newHead++
      }
    }

    while (oldHead <= oldTail) {
      if (getKey((oldKid = oldKids[oldHead++])) == null) {
        dom.removeChild(oldKid)
      }
    }

    for (const [ key, node ] of oldKeyed) {
      if (!newKeyed.has(key)) {
        dom.removeChild(node)
      }
    }
  }

  return dom
}

const vdomify = (vdom: any): VChild =>
  vdom !== true && vdom !== false && vdom ? vdom : ''


const createVdom = (type: string, props: Props, children: VChild[], key?: any): VNode => ({
  type,
  props,
  children,
  key,
})

export const recycleNode = (dom: Node) =>
  dom.nodeType === Node.TEXT_NODE
    ? dom.nodeValue as string
    : createVdom(
        dom.nodeName.toLowerCase(),
        getDomProps(dom as Element),
        EMPTY_ARR.map.call(dom.childNodes, recycleNode) as VNode[],
        getKey(dom),
      )

export const h = (type: string | Function, props?: Props | null, ch?: VChild | VChild[]) =>
  typeof type === 'function'
    ? type(props || {}, ch)
    : createVdom(
        type,
        props || {},
        Array.isArray(ch) ? ch : ch == null ? [] : [ch],
        props?.key
  )

// Helper for Typescript JSX which translates JSX into React.createElement() calls.
// Add `import { React } from 'typewriter-editor';` at the top of any .tsx page to use JSX.
export const React = { createElement: h };

export const patch = (dom: Node, vdom: VNode | VNode[], oldKids?: ChildNode[]) => {
  if (Array.isArray(vdom)) {
    dom = patchChildren(dom, vdom, dom instanceof window.SVGElement, oldKids as Node[]);
  } else {
    dom = patchDom(dom.parentNode as Node, dom, dom, vdom)
  }
  return dom
}
