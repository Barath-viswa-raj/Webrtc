import { createElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CameraSender from './components/robot';
import ViewerReceiver from './components/viewer';

function App() {
  return createElement(
    Router,
    {},
    createElement('nav', {},
      createElement(Link, { to: '/Robot', style: { marginRight: '10px' } }, 'Robot'),
      createElement(Link, { to: '/viewer' }, 'Viewer')
    ),
    createElement(Routes, {},
      createElement(Route, { path: '/Robot', element: createElement(CameraSender) }),
      createElement(Route, { path: '/viewer', element: createElement(ViewerReceiver) })
    )
  );
}

export default App;