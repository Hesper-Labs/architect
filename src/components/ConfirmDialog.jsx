import { useEffect, useRef, useState } from "react";
import { Icon } from "../data/icons.jsx";
import { useDialogStore } from "../store/dialogs.js";
import { useFocusTrap } from "../utils/use-focus-trap.js";

function ConfirmDialog() {
  const dialog = useDialogStore((s) => s.current);
  const resolve = useDialogStore((s) => s.resolve);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, Boolean(dialog));

  useEffect(() => {
    if (!dialog) return;
    if (dialog.type === "prompt") {
      setDraft(dialog.defaultValue ?? "");
      // Autofocus input
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      requestAnimationFrame(() => confirmBtnRef.current?.focus());
    }
  }, [dialog]);

  // Esc to cancel, Enter to confirm
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        resolve(dialog.type === "confirm" ? false : null);
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Don't intercept Enter inside textareas
        if (e.target?.tagName === "TEXTAREA") return;
        e.preventDefault();
        if (dialog.type === "confirm") resolve(true);
        else resolve(draft);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, draft, resolve]);

  if (!dialog) return null;

  const onConfirm = () => {
    if (dialog.type === "confirm") resolve(true);
    else resolve(draft);
  };
  const onCancel = () => resolve(dialog.type === "confirm" ? false : null);

  return (
    <div
      className="modal-scrim"
      onClick={onCancel}
      style={{ background: "rgba(8, 6, 5, 0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        ref={dialogRef}
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          width: "min(440px, 92vw)",
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: dialog.danger
                ? "color-mix(in oklab, var(--rose, #fb7185) 18%, transparent)"
                : "var(--accent-soft)",
              color: dialog.danger ? "var(--rose, #fb7185)" : "var(--accent-ink)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={dialog.danger ? "trash" : "sparkles"} size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              id="confirm-dialog-title"
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: dialog.message ? 4 : 0,
              }}
            >
              {dialog.title}
            </div>
            {dialog.message && (
              <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                {dialog.message}
              </div>
            )}
          </div>
        </div>

        {dialog.type === "prompt" && (
          <input
            ref={inputRef}
            className="field-input"
            type="text"
            value={draft}
            placeholder={dialog.placeholder ?? ""}
            onChange={(e) => setDraft(e.target.value)}
            style={{ width: "100%" }}
          />
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {dialog.cancelLabel || "Cancel"}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={"btn " + (dialog.danger ? "btn-danger" : "btn-primary")}
            onClick={onConfirm}
            disabled={dialog.type === "prompt" && !draft.trim()}
            style={
              dialog.danger
                ? {
                    background: "var(--rose, #fb7185)",
                    color: "#fff",
                  }
                : undefined
            }
          >
            {dialog.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ConfirmDialog };
