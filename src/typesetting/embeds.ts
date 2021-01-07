import { h } from '../rendering/vdom';
import { embed } from './typeset';
import AttributeMap from '../delta/AttributeMap';


export const image = embed({
  name: 'image',
  selector: 'img',
  commands: editor => (image: string, props?: object) => editor.insert({ image, ...props }),
  fromDom: (node: HTMLImageElement) => {
    const image = {};
    ['src', 'alt', 'width', 'height'].forEach(name => {
      if (!node.hasAttribute(name)) return;
      const value = node.getAttribute(name);
      if (name === 'src') name = 'image';
      image[name] = value;
    });
    return image;
  },
  render: (embed: AttributeMap) => {
    const { image, ...props } = embed;
    props.src = image;
    return h('img', props);
  },
});


export const br = embed({
  name: 'br',
  selector: 'br',
  commands: editor => () => editor.insert({ br: true }),
  render: () => h('br'),
});


export const embedDecoration = embed({
  name: 'decoration',
  selector: '.embed.decoration',
  fromDom: false,
  render: (attributes, children) => {
    const classes = 'embed decoration';
    const { name: type, ...props } = attributes.decoration;
    props.class = props.class ? classes + ' ' + props.class : classes;
    return h(type || 'span', props, children);
  }
});
