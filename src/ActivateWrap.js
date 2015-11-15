import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';

// todo: subscribe for route changes
class ActivateWrap extends Component {
  render() {
    const {component, activeClass, route, params, className} = this.props;

    const {router} = this.context;

    if (!router) {
      console.error('No router in context');

      return React.createElement(
        component,
        this.props
      );
    }

    // todo: by href
    const isActive = router.isActive(route, params);
    const props = Object.assign({}, this.props, {className: classnames(className || '', {[activeClass || 'active']: isActive})});
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
  className: PropTypes.string,
  route: PropTypes.string,
  href: PropTypes.string,
  params: PropTypes.object,
};

ActivateWrap.contextTypes = {
  router: PropTypes.object,
};

export default ActivateWrap;
