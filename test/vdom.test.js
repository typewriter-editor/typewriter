import { expect } from 'chai';
import { h, render } from '../src/view/vdom';


describe('======== vdom ========', () => {
  describe('h', () => {

    it('should create a node for an element', () => {
      expect(h('div', { foo: 'bar' }, 'test')).to.deep.equal({
        name: 'div',
        attributes: { foo: 'bar' },
        children: [ 'test' ]
      })
    })


    it('should work with JSX', () => {
      const str = 'test';
      const node = <div foo="bar">
        {str}
      </div>;

      expect(node).to.deep.equal({
        name: 'div',
        attributes: { foo: 'bar' },
        children: [ 'test' ]
      })

    })


    it('should work with functions', () => {
      function Test(attr, children) {
        return <div foo="bar" {...attr}>
          {children}
        </div>;
      }

      expect(<Test disabled>test</Test>).to.deep.equal({
        name: 'div',
        attributes: { foo: 'bar', disabled: true },
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

      expect(node).to.deep.equal({
        name: 'div',
        attributes: {
          foo: 'bar'
        },
        children: [
          {
            name: 'ul',
            attributes: {},
            children: [
              { name: 'li', attributes: {}, children: [ 'red' ]},
              { name: 'li', attributes: {}, children: [ 'green' ]},
              { name: 'li', attributes: {}, children: [ 'blue' ]},
            ]
          }
        ]
      })
    })

  })


  describe('render', () => {

    it('should render HTML from a vdom node', () => {
      const element = render(<div></div>);
      expect(element.nodeName).to.equal('DIV');
      expect(element.attributes.length).to.equal(0);
    })

    // This could get very tedious. Trusting that it works with manual testing.
  })

})
