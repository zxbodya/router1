## Router1 

[![Build Status](https://travis-ci.org/zxbodya/router1.svg)](https://travis-ci.org/zxbodya/router1)
[![codecov.io](https://codecov.io/github/zxbodya/router1/coverage.svg?branch=master)](https://codecov.io/github/zxbodya/router1?branch=master)

Routing library for universal(isomorphic) web applications.

Meant to be customisable low level solution, which can be used to implement routing in application.  

Features:

 - nodejs and browser support
 - not coupled with specific framework
 - powerful url expression language
 - simplicity
 - nested routes definition
 - possibility to implement in browser scrolling correctly
 - hooks for `onbeforeunload` (when navigating between router states)

Router consists of following parts

 - URL expression language
 - history abstraction (for a browser, server, and for testing)
 - router itself

### Expression language

Url patter for routes can be written using following constructions:

- `/path/name` - for static path
- `/path/<param>` - for path with parameter
- `/path/<param:\w+>` - for path with parameter that matches regular expression `\w+`
- `/path?q` - to add query parameter `q` to the url

Note: query parameters can be boolean - if parameter is not passed it would be returned as `false`, if there is no string value - as `true`   

### History abstractions

 - `createServerHistory` provides static location from url, meant to be used server side 
 - `createBrowserHistory` provides browser location. 
   uses html5 history, when available, or `location.assign/replace` when history API is not supported 
 - `createTestHistory` almost the same as `createServerHistory` but allows to navigate, meant to be used for testing  

### Routes definition 

Each route is defined as object with following properties: 

 - `name` - used to reference specific route (when generating URL, or checking is route active) 
 - `url` - URL expression for specific route
 - `handler` or `handlers` array - something that your app will use to handle state associated with route
 - `routes` - array of nested routes

To share common route parts - it is possible to define nested routes. 

When declaring nested routes, they are concatenated with parent route, as following:
 - `name` - combination of all name parts separated by dot symbol
 - `url` - combined URL expression
 - `handlers` - array with all of the route handles

Also, it is allowed to skip route properties when defining nested routes, if so - it would be omitted  

For example:

```
const routes = [
  {
    name: 'home',         
    url: '/home',
    handler: homeHandler,
  },
  {
    name: 'info',         
    url: '/path?query1',
    handler: infoHandler,
    routes: [
      {
        handler: defaultHandler,    
      },
      {
        name: 'article',
        url: '/<articleId:\d+>',
        handler: contactHandler,
      },
      {
        name: 'contact',
        url: '/<contactId:\d+>',
        handler: contactHandler,
      },
    ],
  },
];  
```

would be compiled as the following:

```
const routes = [
  {
    name: 'home',         
    url: '/home',
    handlers: [homeHandler],
  },
  {
    name: 'info',         
    url: '/path?query1',
    handlers: [infoHandler, defaultHandler],
  },
  {
    name: 'info.article',         
    url: '/path/<articleId:\d+>?query1',
    handlers: [infoHandler, contactHandler],
  },
  {
    name: 'info.contact',         
    url: '/path/<contactId:\d+>?query1',
    handlers: [infoHandler, contactHandler],
  },
];  
```

### Router

Router can be created as following:

```
const router = new Router({
  history,
  routes,
  createHandler: (transition) => {
    // transition:
    //  - route - route definition object:
    //      - name - route name
    //      - handlers - handlers specified in route configuration
    //      if no route was matched route would be {name: null, handlers:[]}      
    //  - params - params from matched route
    //  - location - transition location
    //  - forward(url) - method to trigger redirect to specific location
    //  - router - router istance
    //
    // 
    // should return an Observable wich emits value when state is ready to be rendered, 
    // or when handler does not support that request:
    //  - false: if handler can not redner this state - for example data not found 
    //       or next matcher route handler should be used
    //  - state handler, when data was loaded and can be rendered, object with methods
    //     - render() - render state, and returns Observable of rendering results
    //     - hashChange({pathname, search, hash, state}) 
    //          method would be called when location hash was changed after rendring (not triggered on first render)
    //     - onBeforeUnload()
    //          callback, that would be called before transition from state or user trying to close the page
    //          should return message text to be displayed in confirm dialogue,
    //          or empty string when no confirmation is required 
    //           
  },          
});
```

Subscribe to render results:
```
// router will start when you subscribing to results 
router.renderResult()
  .forEach(renderResult => {
    // will be called when route was loaded and rendered
    // can be useful for example to track page views
    // or if you are have server side app - you can return rendered HTML here 
  });
```

To handle `onbreforeload` browser event there is callback `onBeforeUnload` in router, it can be used as following:

```
window.onbeforeunload = (e) => {
  const returnValue = router.onBeforeUnload();
  if (returnValue) {
    e.returnValue = returnValue;
    return returnValue;
  }
};
```

Other public methods:

- `isActive(route, params)` - check if route is active 
    - if route is prefix of active route - route considered active
    - if some of parameters of  active route is not specified it is ignored
- `createUrl(name, params = {}, hash = '')` - create url for route with params
- `navigate(route, params = {}, hash = '', state = {})` - navigate to route with params
- `navigateToUrl(url, state = {})` - navigate to specific url
- `start()` - subscribe to location changes, and start handling routes (also called when using `renderResult`)
- `stop()` - opposite to start, stop listening to location changes

Complete example with react.js https://github.com/zxbodya/router1-app-template
