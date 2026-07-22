// Renderer: main.tsx entry point

import { createRoot } from 'react-dom/client';
import { App } from './application/App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
