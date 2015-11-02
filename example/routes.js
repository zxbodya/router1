import Home from './homePage/Home';
import Cases from './casesPage/Cases';
import Case from './casePage/Case';
import Team from './teamPage/Team';
import Services from './servicesPage/Services';
import Contact from './contactPage/Contact';

export default [
  {
    name: 'home',
    url: '/',
    handler: Home
  },

  {
    name: 'contact',
    url: '/contact',
    handler: Contact
  },
  {
    name: 'services',
    url: '/services',
    handler: Services
  },
  {
    name: 'team',
    url: '/team',
    handler: Team
  },
  {
    name: 'case',
    url: '/case/<slug>',
    handler: Case
  },
  //<Redirect from="/case/" to="/case"/>
  {
    name: 'cases',
    url: '/case',
    handler: Cases
  }
];
