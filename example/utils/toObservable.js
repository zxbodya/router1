import {Observable, helpers} from 'rx';

const observableReturn = Observable.return;
const observableFromPromise = Observable.fromPromise;
const isObservable = Observable.isObservable;
const isPromise = helpers.isPromise;

export default function(data) {
  if (isObservable(data)) return data;
  if (isPromise(data)) return observableFromPromise(data);
  return observableReturn(data);
}
