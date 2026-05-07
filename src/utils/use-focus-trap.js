import { useEffect } from "react";

/**
 * Trap keyboard focus inside `containerRef` while `active` is true.
 *
 * - On activate: moves focus to the first focusable element.
 * - On deactivate: restores focus to whatever was focused before the trap
 *   engaged.
 * - Tab cycles through focusable descendants and wraps at the ends.
 *
 * Focusable selector covers buttons, links, inputs, selects, textareas, and
 * anything with an explicit tabindex >= 0. Disabled elements are excluded.
 *
 * @param {React.RefObject<HTMLElement>} containerRef
 * @param {boolean} [active=true]
 */
export function useFocusTrap(containerRef, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const root = containerRef.current;
    if (!root) return undefined;

    const previousFocus = document.activeElement;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusables = () => Array.from(root.querySelectorAll(focusableSelector));

    // Initial focus — first focusable in the container
    const initial = getFocusables();
    if (initial.length > 0 && !root.contains(document.activeElement)) {
      initial[0].focus();
    }

    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        if (activeEl === first || !root.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previousFocus instanceof HTMLElement) {
        try {
          previousFocus.focus();
        } catch {
          // Element might be gone; ignore.
        }
      }
    };
  }, [containerRef, active]);
}
