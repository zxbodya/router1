'use strict';

const React = require('react');
const {PropTypes, Component} = React;

class Link extends Component {
  render() {
    let {href, route, params, hash} = this.props;
    let {router} = this.context;

    let url;
    let onClick;
    if (href) {
      url = href;
      onClick = (e)=> {
        e.preventDefault();
        router.navigateToUrl(href);
      };
    } else {
      url = router.url(route, params, hash);
      onClick = (e)=> {
        e.preventDefault();
        router.navigate(route, params, hash);
      };
    }
    return (
      <a href={url} {...this.props} onClick={onClick}/>
    );
  }
}

Link.propTypes = {
  route: PropTypes.string,
  href: PropTypes.string,
  params: PropTypes.object,
  hash: PropTypes.string
};

Link.contextTypes = {
  router: PropTypes.object
};

module.exports = Link;
