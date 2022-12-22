import { h, React } from '../src/rendering/vdom';


describe('======== vdom ========', () => {
  describe('h', () => {

    it('should create a node for an element', () => {
      expect(h('div', { foo: 'bar' }, 'test')).toEqual({
        type: 'div',
        key: undefined,
        props: { foo: 'bar' },
        children: [ 'test' ]
      })
    })


    it('should work with JSX', () => {
      const str = 'test';
      const node = <div foo="bar">
        {str}
      </div>;

      expect(node).toEqual({
        type: 'div',
        key: undefined,
        props: { foo: 'bar' },
        children: [ 'test' ]
      })

    })


    it('should work with functions', () => {
      function Test(attr, children) {
        return <div foo="bar" {...attr}>
          {children}
        </div>;
      }

      expect(<Test disabled>test</Test>).toEqual({
        type: 'div',
        key: undefined,
        props: { foo: 'bar', disabled: true },
        children: [ 'test' ]
      })
    })


    it('should work with children', () => {
      const items = [ 'red', 'green', 'blue' ];
      const node = <div foo="bar">
        <ul>
          {items.map(item => <li>{item}</li>)}
        </ul>
      </div>;

      expect(node).toEqual({
        type: 'div',
        key: undefined,
        props: {
          foo: 'bar'
        },
        children: [
          {
            type: 'ul',
            key: undefined,
            props: {},
            children: [
              { type: 'li', key: undefined, props: {}, children: [ 'red' ]},
              { type: 'li', key: undefined, props: {}, children: [ 'green' ]},
              { type: 'li', key: undefined, props: {}, children: [ 'blue' ]},
            ]
          }
        ]
      })
    })

  })

})
