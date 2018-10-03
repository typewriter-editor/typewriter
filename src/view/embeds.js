import { h } from './vdom';


export const image = {
  name: 'image',
  selector: 'img',
  dom: node => node.src,
  vdom: value => <img src={value}/>,
};

export const br = {
  name: 'br',
  selector: 'br',
  vdom: value => <br/>,
};

// To represent a collaborator's cursor, for use in decorators
export const cursor = {
  name: 'cursor',
  selector: 'span.cursor',
  dom: node => ({ name: node.dataset.name, color: node.style.backgroundColor }),
  vdom: value => {
    return <span class="cursor" data-name={value.name} style={ `background-color: ${value.color}` }></span>
  },
};
