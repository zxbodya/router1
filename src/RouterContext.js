import React from 'react';
class RouterContext extends React.Component {
  getChildContext() {
    return {router: this.props.router};
  }

  render() {
    const Component = this.props.component;
    return (
      <Component/>
    );
  }
}

RouterContext.childContextTypes = {
  router: React.PropTypes.object.isRequired
};

RouterContext.propTypes = {
  component: React.PropTypes.func.isRequired,
  router: React.PropTypes.object.isRequired
};

export default RouterContext;
