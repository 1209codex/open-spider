/**
 * @file src/ui/spinner.js
 * Terminal spinner with non-TTY degradation.
 */

import { theme } from './theme.js';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class Spinner {
  /**
   * @param {string} [initialMessage='']
   */
  constructor(initialMessage = '') {
    this.message = initialMessage;
    this.frameIndex = 0;
    this.intervalId = null;
    this.isTTY = !!process.stdout.isTTY && !process.env.NO_COLOR;
  }

  /**
   * Starts spinner animation or logs static message in non-TTY.
   * @param {string} [message]
   */
  start(message) {
    if (message) this.message = message;

    if (!this.isTTY) {
      if (this.message) {
        console.log(`${theme.infoPrefix} ${this.message}...`);
      }
      return this;
    }

    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      const frame = theme.matrix(FRAMES[this.frameIndex]);
      this.frameIndex = (this.frameIndex + 1) % FRAMES.length;
      process.stdout.write(`\r${frame} ${this.message} `);
    }, 80);

    return this;
  }

  /**
   * Stops the spinner.
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      if (this.isTTY) {
        process.stdout.write('\r\x1b[K');
      }
    }
    return this;
  }

  /**
   * Completes spinner with success indicator.
   * @param {string} [message]
   */
  succeed(message) {
    this.stop();
    const finalMsg = message || this.message;
    console.log(`${theme.okPrefix} ${finalMsg}`);
  }

  /**
   * Completes spinner with failure indicator.
   * @param {string} [message]
   */
  fail(message) {
    this.stop();
    const finalMsg = message || this.message;
    console.error(`${theme.failPrefix} ${finalMsg}`);
  }
}

/**
 * Helper to create a new spinner instance.
 * @param {string} [message]
 * @returns {Spinner}
 */
export function createSpinner(message) {
  return new Spinner(message);
}
