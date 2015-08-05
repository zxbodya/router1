import React, {PropTypes, Component} from 'react';

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

export default withRouterContext;
