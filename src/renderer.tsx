// Renderer entry point — main_v4

import { createRoot } from 'react-dom/client';
import './application/index.css';
import { App } from './application/App';
import './index_v4.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
