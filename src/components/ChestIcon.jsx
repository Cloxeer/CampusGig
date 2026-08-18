/**
 * Flat chest glyph for rep-path nodes (lucide has no chest). Inherits
 * currentColor so the node's state styling drives the tint.
 * `open` — lid flipped back: the claimed / already-opened variant.
 */
export default function ChestIcon({ size = 22, open = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {open ? (
        <>
          {/* lid flipped back */}
          <rect x="3.2" y="3.6" width="16" height="4.6" rx="2" transform="rotate(-20 3.2 8.2)" />
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <rect x="10.4" y="12.4" width="3.2" height="4" rx="1" fill="currentColor" stroke="none" />
        </>
      ) : (
        <>
          <path d="M4 10V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <rect x="10.4" y="11.6" width="3.2" height="4.2" rx="1" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
