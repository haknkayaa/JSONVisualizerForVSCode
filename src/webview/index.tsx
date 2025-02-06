import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import 'reactflow/dist/style.css';

declare global {
  interface Window {
    vscodeApi: any;
  }
}

// VSCode API'yi doğrudan HTML'de tanımlayacağız, burada kullanmayacağız
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

// İlk render için boş bir obje gönderelim
root.render(<App initialData={{}} />);

// VSCode webview mesajlarını dinle
window.addEventListener('message', event => {
  const message = event.data;
  if (message.type === 'update') {
    try {
      const jsonData = JSON.parse(message.content);
      root.render(<App initialData={jsonData} />);
    } catch (error) {
      console.error('JSON parse error:', error);
      root.render(<App initialData={{error: 'Invalid JSON'}} />);
    }
  }
}); 