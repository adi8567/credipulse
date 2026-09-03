import { useEffect, useState, useCallback } from 'react';

export function useRealtime(onEvent) {
  const [connected, setConnected] = useState(true);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    // Vercel Serverless Functions do not support long-lived Server-Sent Events (SSE)
    // They will hang and cause 502 Bad Gateway errors across the app.
    // Instead, we use a safe polling mechanism every 30 seconds.
    const interval = setInterval(() => {
      if (onEvent) {
        // Just trigger a refresh callback without full SSE payload
        onEvent({ source: 'polling' });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [onEvent]);

  return { connected, lastEvent };
}
