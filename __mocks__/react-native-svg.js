const React = require('react');

const MockSvg = (props) => React.createElement('svg', props, props.children);
const MockComponent = (name) => (props) => React.createElement(name, props, props.children);

module.exports = {
  __esModule: true,
  default: MockSvg,
  Svg: MockSvg,
  Circle: MockComponent('circle'),
  Path: MockComponent('path'),
  Line: MockComponent('line'),
  Rect: MockComponent('rect'),
  G: MockComponent('g'),
};
