import React, { startTransition, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import 'reactflow/dist/style.css';

declare global {
  interface Window {
    vscodeApi?: {
      getState?: () => { jsonData?: unknown; rawContent?: string } | undefined;
      setState?: (state: { jsonData: unknown; rawContent: string }) => void;
      postMessage?: (message: { type: string }) => void;
    };
  }
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

const getFallbackData = () => ({});
interface WebviewState {
  jsonData: unknown;
  rawContent: string;
}

const getInitialState = (): WebviewState => {
  const persistedState = window.vscodeApi?.getState?.();
  return {
    jsonData: persistedState?.jsonData ?? getFallbackData(),
    rawContent: persistedState?.rawContent ?? ''
  };
};

const WebviewRoot: React.FC = () => {
  const [state, setState] = useState<WebviewState>(getInitialState);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type !== 'update') {
        return;
      }

      const rawContent = typeof message.content === 'string' ? message.content : '';
      let nextJsonData: unknown = getFallbackData();

      try {
        nextJsonData = JSON.parse(rawContent);
      } catch (error) {
        console.error('JSON parse error:', error);
        nextJsonData = { error: 'Invalid JSON' };
      }

      const nextState: WebviewState = {
        jsonData: nextJsonData,
        rawContent
      };

      window.vscodeApi?.setState?.(nextState);

      startTransition(() => {
        setState(nextState);
      });
    };

    window.addEventListener('message', handleMessage);
    window.vscodeApi?.postMessage?.({ type: 'ready' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return <App initialData={state.jsonData} dataSignature={state.rawContent} />;
};

root.render(<WebviewRoot />);
