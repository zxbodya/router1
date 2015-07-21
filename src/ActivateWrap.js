'use strict';

const React = require('react');
const {PropTypes, Component} = React;
const classnames = require('classnames');

//todo: subscribe for route changes
class ActivateWrap extends Component {
  render() {
    let {component, activeClass, route, params, className} = this.props;

    let {router} = this.context;

    if (!router) {
      //todo:
      return <span>No router in context</span>;
    }

    let isActive = router.isActive(route, params);
    let props = Object.assign({}, this.props, {className: classnames(className || '', {[activeClass || 'active']: isActive})});
    return React.createElement(
      component,
      props,
      props.children
    );
  }
}

ActivateWrap.propTypes = {
  component: PropTypes.any.isRequired,
  activeClass: PropTypes.string,
  route: PropTypes.string,
  href: PropTypes.string,
  params: PropTypes.object
};

ActivateWrap.contextTypes = {
  router: PropTypes.object
};

module.exports = ActivateWrap;
