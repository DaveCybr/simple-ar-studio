/**
 * AR Performance Monitor - Real-time performance tracking for AR experience
 * Shows FPS, memory usage, and active markers in debug mode
 */

interface PerformanceStats {
  fps: number;
  fpsHistory: number[];
  memoryUsage: number;
  activeMarkers: number;
  cameraResolution: string;
  loadTime: number;
}

let frameCount = 0;
let lastTime = performance.now();
let fpsHistory: number[] = [];
let monitorElement: HTMLElement | null = null;
let animationFrameId: number | null = null;
let startTime = 0;

const MAX_FPS_HISTORY = 60;

const getMemoryUsage = (): number => {
  // @ts-ignore - performance.memory is Chrome-specific
  if (performance.memory) {
    // @ts-ignore
    return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
  }
  return 0;
};

const getFPSColor = (fps: number): string => {
  if (fps >= 25) return '#22c55e'; // Green
  if (fps >= 20) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

const createMonitorElement = (): HTMLElement => {
  const element = document.createElement('div');
  element.id = 'ar-performance-monitor';
  element.style.cssText = `
    position: fixed;
    top: 120px;
    right: 16px;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    z-index: 10000;
    min-width: 160px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;
  return element;
};

const updateDisplay = (stats: PerformanceStats): void => {
  if (!monitorElement) return;

  const fpsColor = getFPSColor(stats.fps);
  const avgFps = stats.fpsHistory.length > 0
    ? Math.round(stats.fpsHistory.reduce((a, b) => a + b, 0) / stats.fpsHistory.length)
    : 0;

  monitorElement.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: bold; color: ${fpsColor};">
      FPS: ${stats.fps} (avg: ${avgFps})
    </div>
    <div style="opacity: 0.8; line-height: 1.6;">
      ${stats.memoryUsage > 0 ? `Memory: ${stats.memoryUsage}MB<br>` : ''}
      Markers: ${stats.activeMarkers}<br>
      Camera: ${stats.cameraResolution}<br>
      Load: ${stats.loadTime}ms
    </div>
  `;
};

const measureFPS = (): void => {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    fpsHistory.push(fps);
    
    if (fpsHistory.length > MAX_FPS_HISTORY) {
      fpsHistory.shift();
    }

    updateDisplay({
      fps,
      fpsHistory,
      memoryUsage: getMemoryUsage(),
      activeMarkers: window.__arActiveMarkers || 0,
      cameraResolution: window.__arCameraResolution || 'N/A',
      loadTime: startTime > 0 ? Math.round(performance.now() - startTime) : 0,
    });

    // Log warning if FPS is consistently low
    if (fps < 20 && fpsHistory.length >= 5) {
      const recentAvg = fpsHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;
      if (recentAvg < 20) {
        console.warn(`[Performance] Low FPS detected: ${fps}. Consider reducing quality settings.`);
      }
    }

    frameCount = 0;
    lastTime = currentTime;
  }

  animationFrameId = requestAnimationFrame(measureFPS);
};

export const startPerformanceMonitor = (): void => {
  // Only start if debug mode is enabled
  const params = new URLSearchParams(window.location.search);
  if (!params.has('debug') && params.get('debug') !== '1') {
    return;
  }

  console.log('[Performance] Monitor started');
  startTime = performance.now();

  if (!monitorElement) {
    monitorElement = createMonitorElement();
    document.body.appendChild(monitorElement);
  }

  if (animationFrameId === null) {
    measureFPS();
  }
};

export const stopPerformanceMonitor = (): void => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (monitorElement && monitorElement.parentNode) {
    monitorElement.parentNode.removeChild(monitorElement);
    monitorElement = null;
  }

  fpsHistory = [];
  frameCount = 0;
};

export const setActiveMarkers = (count: number): void => {
  window.__arActiveMarkers = count;
};

export const setCameraResolution = (resolution: string): void => {
  window.__arCameraResolution = resolution;
};

export const logPerformanceEvent = (event: string, data?: Record<string, unknown>): void => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('debug') || params.get('debug') === '1') {
    console.log(`[Performance] ${event}`, data || '');
  }
};

// Extend Window interface for global state
declare global {
  interface Window {
    __arActiveMarkers?: number;
    __arCameraResolution?: string;
  }
}
