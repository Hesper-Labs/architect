import { Icon } from "../data/icons.jsx";
import { useToastStore } from "../store/toasts.js";

const LEVEL_META = {
  info: { icon: "sparkles", color: "var(--accent-ink)" },
  success: { icon: "check", color: "var(--green, #22c55e)" },
  error: { icon: "x", color: "var(--rose, #fb7185)" },
  warning: { icon: "bell", color: "var(--amber, #f59e0b)" },
};

function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 100,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const meta = LEVEL_META[t.level] ?? LEVEL_META.info;
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 12px 10px 12px",
              borderRadius: 10,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              boxShadow: "0 14px 28px -10px rgba(0,0,0,0.55)",
              minWidth: 220,
              maxWidth: 380,
              fontSize: 13,
              color: "var(--ink-1)",
              pointerEvents: "auto",
              animation: "architect-toast-in 0.18s cubic-bezier(.3,.7,.4,1)",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: `color-mix(in oklab, ${meta.color} 18%, transparent)`,
                color: meta.color,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <Icon name={meta.icon} size={12} />
            </span>
            <div style={{ flex: 1, lineHeight: 1.45 }}>
              {t.title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>}
              <div style={{ color: t.title ? "var(--ink-2)" : "var(--ink-1)" }}>{t.message}</div>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--ink-3)",
                cursor: "pointer",
                padding: 2,
                marginTop: 1,
                borderRadius: 4,
              }}
            >
              <Icon name="x" size={11} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes architect-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export { ToastStack };
