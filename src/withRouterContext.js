'use strict';

const React = require('react');
const {PropTypes, Component} = React;

function withRouterContext(ComponentToEnhance, router) {

  class RouterContext extends Component {
    getChildContext() {
      return {router};
    }

    render() {
      return (
        <ComponentToEnhance {...this.props}/>
      );
    }
  }


  RouterContext.childContextTypes = {
    router: PropTypes.object.isRequired
  };

  return RouterContext;
}

module.exports = withRouterContext;
