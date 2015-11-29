## Router development roadmap

? move render back
  
6. history abstraction testing 
6. state hooks
  enter - done
  leave
  beforeunload - stream of strings or falsy values
? state updates (reuse state parts acrouse routes, allow updates without whole state rebuild)
8. Allow baseurl, add createHref to history
10. Post requests handling (?)
14. trailing slash handling
15. allow to return just React.Component instead of RxComponent 
16. let browser to make request if url is not matched
17. disable js navigation for other domains (web.archive.org)

6. search params

==============
## Router Api change 

+ scroll to anchor animation
 
## Router behavior

1. Page load
  -> resolve route
  -> render/update
  -> scroll if hash presented, do not scroll if hash is empty(for ex.: when user refreshes the page)

2. Click on url with new url
  -> pushState()
  -> resolve route
  -> render/update
  -> scroll top or to anchor 

2. Click on link with same url
  -> scroll

2. onpopstate event
 - back, forward
   -> resolve route
   -> render/update
 - click on anchor
   -> scroll
 - enter hash in location
   -> scroll 




## Router roadmap

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
