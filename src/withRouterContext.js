'use strict';

const React = require('react');
const {PropTypes, Component} = React;

function withRouterContext(ComponentToEnhance, router, route) {

  class RouterContext extends Component {
    getChildContext() {
      return {router, route};
    }

    render() {
      return (
        <ComponentToEnhance {...this.props}/>
      );
    }
  }


  RouterContext.childContextTypes = {
    router: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired
  };


  return RouterContext;
}

module.exports = withRouterContext;
