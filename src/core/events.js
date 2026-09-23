// src/core/events.js
/**
 * In-memory real-time event bus for Open-Spider.
 * Emits orchestration lifecycle events, task progress, and live worker stream output
 * to subscribers and Server-Sent Events (SSE) web clients.
 */

import { EventEmitter } from 'node:events';

class SpiderEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Broadcasts an event to all local and SSE listeners.
   * @param {string} type - Event type (e.g. 'task:start', 'task:output', 'run:complete')
   * @param {object} payload - Event data payload
   */
  emitEvent(type, payload = {}) {
    const event = {
      type,
      timestamp: Date.now(),
      ...payload
    };
    this.emit(type, event);
    this.emit('*', event);
  }

  /**
   * Helper to emit task log output chunk.
   * @param {string} runId
   * @param {string} taskId
   * @param {string} worker
   * @param {string} text
   */
  emitTaskOutput(runId, taskId, worker, text) {
    this.emitEvent('task:output', { runId, taskId, worker, text });
  }

  /**
   * Helper to emit task lifecycle state transition.
   * @param {string} status - 'started' | 'completed' | 'failed'
   * @param {object} details
   */
  emitTaskState(status, details) {
    this.emitEvent(`task:${status}`, details);
  }

  /**
   * Helper to emit run lifecycle state.
   * @param {string} status - 'start' | 'completed' | 'failed'
   * @param {object} details
   */
  emitRunState(status, details) {
    this.emitEvent(`run:${status}`, details);
  }

  /**
   * Helper to emit worker health or state updates.
   * @param {string} workerId
   * @param {string} status - 'idle' | 'working' | 'limited'
   * @param {object} [task]
   */
  emitWorkerState(workerId, status, task = null) {
    this.emitEvent('worker:state', { workerId, status, task });
  }
}

export const events = new SpiderEventBus();
