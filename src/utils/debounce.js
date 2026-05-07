/**
 * Returns a debounced version of `fn` that waits `delay` ms after the last call
 * before invoking. Subsequent calls within the window reset the timer.
 *
 * @template {(...args: unknown[]) => unknown} F
 * @param {F} fn
 * @param {number} delay
 * @returns {F & { cancel: () => void; flush: () => void }}
 */
export function debounce(fn, delay = 500) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
    }, delay);
  }

  debounced.cancel = () => {
    if (timer != null) clearTimeout(timer);
    timer = null;
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timer != null && lastArgs) {
      clearTimeout(timer);
      timer = null;
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };

  return debounced;
}
