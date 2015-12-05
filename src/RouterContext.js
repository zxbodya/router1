import React from 'react';
class RouterContext extends React.Component {
  getChildContext() {
    return {router: this.props.router};
  }

  render() {
    return this.props.render();
  }
}

RouterContext.childContextTypes = {
  router: React.PropTypes.object.isRequired,
};

RouterContext.propTypes = {
  render: React.PropTypes.func.isRequired,
  router: React.PropTypes.object.isRequired,
};

export default RouterContext;
