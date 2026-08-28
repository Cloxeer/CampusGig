import { useRef } from "react";
import { Loader } from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

/**
 * Mobile pull-to-refresh around a `.scroll` region. Desktop (≥900px) is a no-op.
 */
export default function PullToRefresh({ onRefresh, className = "", children, disabled = false }) {
  const scrollRef = useRef(null);
  const enabled = Boolean(onRefresh) && !disabled;
  const { pullPx, busy, armed } = usePullToRefresh({
    scrollRef,
    onRefresh,
    enabled,
  });

  return (
    <div ref={scrollRef} className={`ptr ${className}`.trim()}>
      <div
        className="ptr-indicator"
        style={{ height: pullPx }}
        aria-hidden={!busy}
        aria-live="polite"
      >
        {pullPx > 10 ? (
          <Loader
            size={18}
            className={busy || armed ? "spin" : undefined}
            color="var(--fg3)"
          />
        ) : null}
        {busy ? <span className="sr-only">Refreshing</span> : null}
      </div>
      {children}
    </div>
  );
}
