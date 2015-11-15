import {Observable} from 'rx';

function historyFactory(pathname) {
  return {
    push() {
      throw new Error('navication not supported');
    },
    replace() {
      throw new Error('navication not supported');
    },
    location: Observable
      .return({
        pathname,
        search: '',
        hash: '',
      })
      .shareReplay(),
  };
}

export default historyFactory;
