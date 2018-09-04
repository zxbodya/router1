# Changelog

## 0.12.1 (2018-09-04)

- Babel 7

## 0.12.0 (2018-04-26)

- rxjs v6

## 0.11.0 (2018-01-21)

- fixed route params comparison when checking active route - properly normalize params before comparison, not changing booleans in search params (strings `true` or `false` passed in search params might be not properly checked)
- refactoring to simplify router code, fixes to make flow happier about some edge cases
- added proper encoding for pathname

## 0.10.0 (2017-12-23)

- added more warnings in development build
- added `hashchange` support for old browsers in `createBroswerHistory`
- improved test coverage
- updated dev tooling migrated to babel preset env

## 0.9.0 (2017-11-19)

*Breaking changes:*

move common logic that was expected to be `createHandler` to Router, replace it with more granular config 

 - `loadState(transition):Observable` loads matched state associated with transition object, if needed data not found and next matching route should be used - should emit false
 - `renderState(state, transition):Observable` - render loaded state, and returns Observable with rendering result
 - `afterRender(stateHandler, {state, transition, renderResult})` called after new state was rendered (to be used effects like scroll to anchor)
 - `onHashChange` hash change callback to be used by default (since in typical case it is the same for all pages)

## 0.8.0 (2017-10-28)

Start using RxJS lettable operators.

## 0.7.1 (2017-10-26)

Bugfix release:

- fixed possible incorrect subscription order(resulting in subscription to previous render result), when redirecting.
- rethrow unhandled exceptions if no external subscription for render results (instead of silently ignoring them)

Chore:

- start using prettier

## 0.7.0 (2017-09-18)

Start using rollup to bundle library for distribution

## 0.6.1  (2017-04-9)

- use RxJS in modular way(reducing resulting bundle size)

## 0.6.0  (2016-12-20)

- migrate to RxJS 5
- improve documentation

## 0.5.0  (2016-08-15)

- `createHandler` in route configuration instead of `render` to offer possibility of adding state hooks, and to better resolve conflicting routes
- `onbeforeunload` for both page unload and route transitions
- better redirect handling, catch redirect errors
  - when trying to reditect to same location
  - when redirecting to many times sequentially (more than 20 times), to prevent redirect loop 
- add `start()/stop()` methods in router instance, stop starting router in `renderResult()`
- move url generation and parsing to history backends, stop emmiting non user location changes from history (now this is handled internally by router)
- remove `?` and `#` prefixes from location search and hash respectively
- better test coverage
- extracted RouteCollection class, separate it from router (to allow sharing route collection between multiply router instances server-side)
- added `createHashHistory` to allow using `location.hash` to store url
- better documentation in readme
- start writing changelog

## 0.4.4  (2016-07-08)

- Improve warning message for case when few routes are matching same location
- Fix code coverage reports
- Add changelog

## 0.4.3  (2016-06-26)

Documentation updates

## 0.4.2  (2016-06-26)

Improve test coverage, bugfix

## 0.4.1  (2016-06-26)

Fix case when passing handlers array into route definition, improve test suite

## 0.4.0  (2016-05-07)

Start use named exports for most of things (breaking in case of requiring files directly from `lib`)

## 0.3.3  (2016-05-07)

Was republished as 0.4.0 because of breaking changes 

## 0.3.2  (2016-04-25)

Fixed router.isActive for non string route parameters 

## 0.3.1  (2016-04-22)

 - allow routes with empty name
 - router.isActive now can detect nested routes
 - allow nested route definition

## 0.3.0  (2016-04-22)

Rename state data parameter in location from `data` to `state` 

## 0.2.1  (2016-04-22)

Fixed module exports (was correct only for babel5)

## 0.2.0  (2016-04-22)

Add possibility for using attach state data 

## 0.1.6  (2016-04-21)

Fix parsing boolean params in location.search

## 0.1.5  (2016-03-11)

Fixed issue extremely slow regexp in expression verification

## 0.1.4  (2016-02-01)

Switched to babel6

## 0.1.3  (2015-12-15)

Tests, bugfix 

## 0.1.2  (2015-12-08)

Tests, bugfix

## 0.1.1  (2015-12-05)

Module exports, documentation improvements

## 0.1.0  (2015-12-05)

Move react components to separate packege (router1-react)

## 0.0.2  (2015-12-04)

Fix npm package 

## 0.0.1  (2015-12-04)

Initial release
