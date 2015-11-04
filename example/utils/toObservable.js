import {Observable, helpers} from 'rx';

const observableReturn = Observable.return;
const observableFromPromise = Observable.fromPromise;
const isObservable = Observable.isObservable;
const isPromise = Rx.helpers.isPromise;

export default function (data) {
  return isObservable(data)
    ? data
    : (
    isPromise(data)
      ? observableFromPromise(data)
      : observableReturn(data)
  );
}
