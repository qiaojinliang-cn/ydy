import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './pages.css';

const host = document.getElementById('root');
if (!host) throw new Error('The workspace root element is missing from index.html');
createRoot(host).render(<StrictMode><App /></StrictMode>);
