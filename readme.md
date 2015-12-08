## Router1 

[![Build Status](https://travis-ci.org/zxbodya/router1.svg)](https://travis-ci.org/zxbodya/router1)
[![Coverage Status](https://coveralls.io/repos/zxbodya/router1/badge.svg?branch=master&service=github)](https://coveralls.io/github/zxbodya/router1?branch=master)



Complete routing solution for isomophic reactive applications

```JSX

import createBrowserHistory from 'router1/lib/createBrowserHistory';
import createServerHistory from 'router1/lib/createServerHistory';

// simple history abstraction for a browser:
// - uses html5 history, when available
// - or uses `location.assign/replace` when history API is not supported

const history = createBrowserHistory();

// server side history implementation
// creates history abstraction that will always return one pathname

const history = createServerHistory(requestPath);

const routes = [ // just an array of available routes
  {
    // route name
    name: 'home',         
    // url expression (more detailed docs coming soon)
    url: '/path/<param1>/<param2:\d+>?query1&query2',
    // route handler - can be whatever you want
    handler: homeHandler,
  },
];  

const router = new Router({
  history,
  routes,
  render: (routingResult)=> {
    // routingResult:
    //  - route: route name or null if nothing matched,
    //  - handler: handler specified in configuration
    //  - params: params in matched route
    //  - location: current location
    
    // should return an observable that will emit onNext when route would be rendered 
  },
});


router.hashChange
  .forEach(hash => {
    // hash changes in route (useful to animate scrolling)
    // does not emit first hash value
  });

// router will start when you subscribing to results 
router.renderResult()
  .forEach(renderResult => {
    // will be called when route was loaded and rendered
    // can be useful for example to track page views
    // or if you are have server side app - you can return rendered html here 
  });

```
