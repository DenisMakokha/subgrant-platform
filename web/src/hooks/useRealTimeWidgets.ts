import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

/**
 * useRealTimeWidgets Hook
 * 
 * Manages real-time updates for dashboard widgets
 * Subscribes to widget-specific events and triggers refreshes
 */

interface UseRealTimeWidgetsOptions {
  widgetIds: string[];
  onUpdate: (widgetId: string, data: any) => void;
  enabled?: boolean;
}

export function useRealTimeWidgets({
  widgetIds,
  onUpdate,
  enabled = true
}: UseRealTimeWidgetsOptions) {
  const { connected, subscribe, emit } = useWebSocket();

  // Subscribe to widget updates
  useEffect(() => {
    if (!enabled || !connected || widgetIds.length === 0) {
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Subscribe to each widget's update event
    widgetIds.forEach(widgetId => {
      const unsubscribe = subscribe(`widget:${widgetId}:update`, (data) => {
        console.log(`Real-time update for widget ${widgetId}:`, data);
        onUpdate(widgetId, data);
      });
      unsubscribers.push(unsubscribe);
    });

    // Subscribe to general dashboard updates
    const unsubscribeDashboard = subscribe('dashboard:update', (data) => {
      console.log('Dashboard update:', data);
      if (data.widgetId && widgetIds.includes(data.widgetId)) {
        onUpdate(data.widgetId, data.data);
      }
    });
    unsubscribers.push(unsubscribeDashboard);

    // Notify server that we're watching these widgets
    emit('dashboard:subscribe', { widgetIds });

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
      emit('dashboard:unsubscribe', { widgetIds });
    };
  }, [widgetIds, enabled, connected, subscribe, emit, onUpdate]);

  // Manual refresh trigger
  const refreshWidget = useCallback((widgetId: string) => {
    if (connected) {
      emit('widget:refresh', { widgetId });
    }
  }, [connected, emit]);

  // Refresh all widgets
  const refreshAll = useCallback(() => {
    if (connected) {
      emit('dashboard:refresh', { widgetIds });
    }
  }, [connected, emit, widgetIds]);

  return {
    connected,
    refreshWidget,
    refreshAll
  };
}
