import React, {PropTypes, Component} from 'react';

class Link extends Component {
  render() {
    let {href, route, params, hash} = this.props;
    let {router} = this.context;

    if (!router) {
      //todo:
      return <span>No router in context</span>;
    }

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
    return React.createElement(
      'a',
      Object.assign({href: url, onClick}, this.props),
      this.props.children
    );
  }
}

Link.propTypes = {
  route: PropTypes.string,
  href: PropTypes.string,
  params: PropTypes.object,
  hash: PropTypes.string,
  children: PropTypes.any
};

Link.contextTypes = {
  router: PropTypes.object
};

export default Link;
