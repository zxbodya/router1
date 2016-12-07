## Router1 

[![Build Status](https://travis-ci.org/zxbodya/router1.svg)](https://travis-ci.org/zxbodya/router1)
[![codecov.io](https://codecov.io/github/zxbodya/router1/coverage.svg?branch=master)](https://codecov.io/github/zxbodya/router1?branch=master)

Reactive routing library for universal(isomorphic) web applications. Built with RxJS.

It is meant to be foundation for implementing routing in your application in a way you want it to be.

What makes it different? Why it was created?

  - reactive
  - declarative
  - minimalistic
  - feature complete
  - ui framework agnostic

It provides:

 - url matching, 
 - url generation (by route name and parameters)
 - history abstractions for various use cases (server-side, html5 browser, via location.hash, or for tests)
 - transition handling (waiting for data, redirect, before enter checks, automatic cancellation of previous transition)
 - state updates handling (`hashchange`, `onbeforeunload`)
 - checking if route is active

Above that it:

 - is not coupled to specific UI library, and does not dictate how to structure your view components
 - has powerful url expression language, allowing to use regular expressions for url parts 
 - supports url query parameters
 - allows nested routes definition, and is not opinionated about composing handlers for them(it is up to you)
 - allows to have conflicting route patterns (and will use the first one with available data)
 - allows to pass additional state when navigating 
 - offers possibility for implementing better ux
     - can wait for minimal required data before transition to new state
     - scrolling top or to anchor only after initial state render(since it waits for minimal required data - it will scroll to the right place on page)
     - not scrolling when navigating backward or forward (browser restores correct scroll position on its own)
     - not finished transition is automatically canceled when new one is started

## Installation 

Library is available on npm as `router1`.

When using with React - [router1-react](https://github.com/zxbodya/router1-react) would be helpful, it provides all required components.
 
Also, I tried to make it as un-opinionated as possible, so following parts are not included:
 - how rendering should happen
 - how scrolling should be done
 - when to scroll and when do not

However all this can be quite typical for most of application, 
and you can see reference implementation here [router1-app-template](https://github.com/zxbodya/router1-app-template)
Application template provides webpack build and dev server configurations and routing implementation, also it uses
 [rx-react-container](https://github.com/zxbodya/rx-react-container) for connecting rxjs logic to react views.


## Quick overview 

Router consists of following parts

 - URL expression language
 - history abstraction (for a browser, server, and for testing)
 - router itself

### Expression language

Url pattern for routes can be written using following constructions:

- `/path/name` - for static path
- `/path/<param>` - for path with parameter
- `/path/<param:\w+>` - for path with parameter that matches regular expression `\w+`
- `/path?q` - to add query parameter `q` to the url

Note: query parameters can be boolean - if parameter is not passed it would be returned as `false`, if there is no string value - as `true`   

### History abstractions

 - `createServerHistory` provides static location from url, meant to be used server side 
 - `createBrowserHistory` provides browser location. 
   uses html5 history, when available, or `location.assign/replace` when history API is not supported
 - `createHashLocation` like `createBrowserHistory` but using `location.hash` to store url, usefull for cordova apps or supporting older browsers
 - `createTestHistory` almost the same as `createServerHistory` but allows to navigate, meant to be used for testing  

### Routes definition 

Routes collection is represented by class `RouteCollection`, which can be created as `new RouteCollection(routes)` 

Each route is defined as object with following properties: 

 - `name` - used to reference specific route (when generating URL, or checking is route active) 
 - `url` - URL expression for specific route
 - `handler` or `handlers` array - "something" that your app will use to handle state associated with the route(more details below)
 - `routes` - array of routes, nested in current one

When declaring nested routes, they are combined, as following:
 - `name` - combination of all name parts separated by dot symbol
 - `url` - combined URL expression
 - `handlers` - array with all of the route handles

When declaring nested routes, all properties are optional and would be skipped.

For example:

```js
const routeCollection = new RouteCollection([
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
        url: '/<articleId:\\d+>',
        handler: contactHandler,
      },
    ],
  },
]);  
```

Effectively is the same as:

```js
const routeCollection = new RouteCollection([
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
    url: '/path/<articleId:\\d+>?query1',
    handlers: [infoHandler, contactHandler],
  },
]);  
```

Handlers in route declaration can be anything you like, that would be enough for state handling.

### Router

Router has few dependencies `history`, `routeCollection` and `createHandler`.

`createHandler` is a function responsible creating a handler for a new state before transition starts.
It is the place where you define how state and transitions are handled. 

As argument, it takes transition description object which has following properties:
 
- `route` - route definition object
  - `name` - route name
  - `handlers` - handlers specified in route configuration
- `params` - params from matched route
- `location` - transition location
- `forward(url)` - method to trigger redirect to specific location
- `router` - router instance (can be useful to generate redirect or url for example)

In case when no matching route was found `route` would be set to `{name: null, handlers:[]}`)

`createHandler` function should return an Observable which emits value when state is loaded and can be rendered:

- `false` if handler can not render this state - for example required data not found and next matching route should be used
- state handler object, when data was loaded and can be rendered, it has following methods:
   - `render()` - render state, and returns Observable with rendering results (which would be passed to `router.renderResult` mentioned below)
   - `hashChange({pathname, search, hash, state})` - method would be called when location hash was changed after rendring (not triggered on first render)
   - `onBeforeUnload()` - callback, that would be called before transition from state or user trying to close the page.
     - should return text message to be displayed in confirm dialogue,
     - or empty string when no confirmation is required 

Router can be created as following:

```js
const router = new Router({
  history,
  routeCollection,
  createHandler: (transition) => {
    // combine matched route handlers
    // returns observable with state handler ready to to be displayed
  },          
});
```

Start/stop listening location changes

 - `start()` - subscribe to location changes, and start handling routes (also called when using `renderResult`)
 - `stop()` - opposite to start, stop listening to location changes

Subscribe to render results:
```js
router.renderResult()
  .forEach(renderResult => {
    // will be called when route was loaded and rendered
    // can be useful for example to track page views
    // or if you are have server side app - you can return rendered HTML here 
  });
```


To handle `onbreforeload` browser event there is callback `onBeforeUnload` in router, it can be used as following:

```js
window.onbeforeunload = (e) => {
  const returnValue = router.onBeforeUnload();
  if (returnValue) {
    e.returnValue = returnValue;
    return returnValue;
  }
};
```

Other router public methods are:

- `isActive(route, params)` - check if route is active 
    - if route is prefix of active route - route considered active
    - if some of parameters of  active route is not specified it is ignored
- `createUrl(name, params = {}, hash = '')` - create url for route with params
- `navigate(route, params = {}, hash = '', state = {})` - navigate to route with params
- `navigateToUrl(url, state = {})` - navigate to specific url
