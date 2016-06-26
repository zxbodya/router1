## Router1 

[![Build Status](https://travis-ci.org/zxbodya/router1.svg)](https://travis-ci.org/zxbodya/router1)
[![codecov.io](https://codecov.io/github/zxbodya/router1/coverage.svg?branch=master)](https://codecov.io/github/zxbodya/router1?branch=master)

Reactive routing library for universal(isomorphic) web applications.

Features:

 - simplicity
 - nodejs and browser support
 - nested routes definition

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

 - `router1/lib/createServerHistory` provides static location from url, meant to be used server side 
 - `router1/lib/createBrowserHistory` provides browser location. 
   uses html5 history, when available, or `location.assign/replace` when history API is not supported 
 - `router1/lib/createTestHistory` almost the same as `createServerHistory` but allows to navigate, meant to be used for testing  

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
  render: (routingResult) => {
    // routingResult:
    //  - route: route name or null if nothing matched,
    //  - handlers: handlers specified in route configuration
    //  - params: params from matched route
    //  - location: current location
    
    // should return an observable with render results
  },
});
```

Subscribe to hash-only changes:
```
router.hashChange
  .forEach(hash => {
    // hash changes in route (useful to animate scrolling)
    // does not emit first hash value
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

Other public methods:

- `isActive(route, params)` - check if route is active 
    - if route is prefix of active route - route considered active
    - if some of parameters of  active route is not specified it is ignored
- `createUrl(name, params = {}, hash = '')` - create url for route with params
- `navigate(route, params = {}, hash = '', state = {})` - navigate to route with params
- `navigateToUrl(url, state = {})` - navigate to specific url


Complete example with react.js https://github.com/zxbodya/router1-app-template
