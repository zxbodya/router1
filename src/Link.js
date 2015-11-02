import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';

class Link extends Component {
  render() {
    let {href, route, params, hash, className, activeClassName, onClick:onClickOriginal} = this.props;
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
        onClickOriginal && onClickOriginal(e);
        e.preventDefault();
        router.navigateToUrl(href);
      };
      isActive = false; // todo:
    } else {
      url = router.createUrl(route, params, hash);
      onClick = (e)=> {
        onClickOriginal && onClickOriginal(e);
        e.preventDefault();
        router.navigate(route, params, hash);
      };

      isActive = router.isActive(route, params);
    }
    let props = Object.assign(
      {},
      this.props, {
        href: url,
        onClick
      },
      {className: classnames(className || '', {[activeClassName || 'active']: isActive && activeClassName})}
    );
    return React.createElement(
      'a',
      props,
      props.children
    );
  }
}

Link.propTypes = {
  onClick: PropTypes.func,
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
