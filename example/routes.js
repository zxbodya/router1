import Home from './Home/Home';
import Cases from './Cases';
import Case from './Case';
import Team from './Team';
import Services from './Services';
import Contact from './Contact';

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
