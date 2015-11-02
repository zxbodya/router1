import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';

class Link extends Component {
  render() {
    let {href, route, params, hash, className, activeClassName} = this.props;
    let {router} = this.context;

    if (!router) {
      console.error('No router in context');

      return React.createElement(
        'a',
        Object.assign({href: url, onClick}, this.props),
        this.props.children
      );
    }

    let url;
    let onClick;
    let isActive;
    if (href) {
      url = href;
      onClick = (e)=> {
        e.preventDefault();
        router.navigateToUrl(href);
      };
      isActive = false; // todo:
    } else {
      url = router.createUrl(route, params, hash);
      onClick = (e)=> {
        e.preventDefault();
        router.navigate(route, params, hash);
      };

      isActive = router.isActive(route, params);
    }
    let props = Object.assign({
        href: url,
        onClick
      },
      this.props,
      {className: classnames(className || '', {[activeClassName || 'active']: isActive})}
    );
    return React.createElement(
      'a',
      props,
      props.children
    );
  }
}

Link.propTypes = {
  route: PropTypes.string,
  href: PropTypes.string,
  params: PropTypes.object,
  hash: PropTypes.string,
  children: PropTypes.any,
  className: PropTypes.string,
  activeClassName: PropTypes.string
};

Link.contextTypes = {
  router: PropTypes.object
};

export default Link;
