import homeHandler from './homePage/homeHandler';
import casesHandler from './casesPage/casesHandler';
import caseHandler from './casePage/caseHandler';
import teamHandler from './teamPage/teamHandler';
import servicesHandler from './servicesPage/servicesHandler';
import contactHandler from './contactPage/contactHandler';

export default [
  {
    name: 'home',
    url: '/',
    handler: homeHandler
  },

  {
    name: 'contact',
    url: '/contact',
    handler: contactHandler
  },
  {
    name: 'services',
    url: '/services',
    handler: servicesHandler
  },
  {
    name: 'team',
    url: '/team',
    handler: teamHandler
  },
  {
    name: 'case',
    url: '/case/<slug>',
    handler: caseHandler
  },
  //<Redirect from="/case/" to="/case"/>
  {
    name: 'cases',
    url: '/case',
    handler: casesHandler
  }
];
