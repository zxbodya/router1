import React from 'react';
import Router, {Route, DefaultRoute, NotFoundRoute, Redirect} from 'react-router';

import NotFound from './NotFound';
import Home from './Home/index';
import Cases from './Cases';
import Case from './Case';
import Team from './Team';
import Services from './Services';
import Contact from './Contact';
import Application from './Application';

export default [
  <Route name="app" path="/" handler={Application}>
    <Route name="contact" path="/contact" handler={Contact}/>
    <Route name="services" path="/services" handler={Services}/>
    <Route name="team" path="/team" handler={Team}/>
    <Route name="case" path="/case/:slug" handler={Case}/>
    <Redirect from="/case/" to="/case"/>
    <Route name="cases" path="/case" handler={Cases}/>
    <DefaultRoute handler={Home}/>
  </Route>,
  <NotFoundRoute handler={NotFound}/>
];
