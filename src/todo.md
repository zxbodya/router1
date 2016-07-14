1. error handlers
  + 404
  - 500
2. interface simplification
  - one handler create?
  - location source ? - is it useless
3. server side
  + basic rendering
  + basic redirect
  - circular redirect errors 
5. refactoring
  - cleanup Router::start
6. history
  - add options object with basePath
  - hash change event in older browsers
7. server side redirect
  - forward ?
 ---
 

7. state updates (reuse state parts acrouse routes, allow updates without whole state rebuild) ?
10. Post requests handling (?)
14. trailing slash handling
16. let browser to make request if url is not matched
17. disable js navigation for other domains (web.archive.org)

--------------

1. route collection
	match() : url -> name, handlers, parameters || 404
	generate(): route, parameters -> url || error
    add()
	

2. route handler

	handle() : route, params, * state -> state
	- before unload
	- onLeave() [cancel transition, do side effects]
	- resolve data
	- onEnter() [cancel transition, do side effects, redirect]
	- replace state | update state

3. renderer:
	- wait for minimum renderable | or wait for server renderable
	- render
	- do scrolls
	
4. router context
	- generate url
	- is route active
	- subscribe for 'route active' changes

-------------

https://www.npmjs.com/package/selenium-webdriver
http://seleniumhq.github.io/selenium/docs/api/javascript/
https://code.google.com/p/selenium/wiki/WebDriverJs
