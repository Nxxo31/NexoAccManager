// Renderer entry point — Mantine + App

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { theme as mantineTheme } from './theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { App } from './application/App';
import './application/index.css';
import './index_v4.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
    <ModalsProvider>
      <Notifications position="top-right" />
      <App />
    </ModalsProvider>
  </MantineProvider>
);