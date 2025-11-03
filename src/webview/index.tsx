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

const render = (data?: any, errorMessage?: string) => {
  root.render(<App initialData={data} errorMessage={errorMessage} />);
};

// İlk render için boş bir obje gönderelim
render({});

// VSCode webview mesajlarını dinle
window.addEventListener('message', event => {
  const message = event.data;

  if (message.type === 'error') {
    render(undefined, message.message ?? 'Unable to parse JSON content.');
    return;
  }

  if (message.type === 'update') {
    try {
      const jsonData = JSON.parse(message.content);
      render(jsonData);
    } catch (error) {
      console.error('JSON parse error:', error);
      render(undefined, 'The JSON content could not be parsed.');
    }
  }
});