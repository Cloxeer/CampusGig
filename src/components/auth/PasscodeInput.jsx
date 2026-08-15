import { useId, useRef } from "react";

const SLOT_COUNT = 6;

/**
 * 6-digit passcode entry with aligned digit boxes.
 * @param {object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.id]
 * @param {boolean} [props.disabled]
 * @param {string} [props.label]
 */
export default function PasscodeInput({ value, onChange, id: idProp, disabled = false, label = "6-digit passcode" }) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const inputRef = useRef(null);

  const digits = String(value ?? "").replace(/\D/g, "").slice(0, SLOT_COUNT);

  function handleChange(e) {
    const next = e.target.value.replace(/\D/g, "").slice(0, SLOT_COUNT);
    onChange(next);
  }

  function focusInput() {
    if (!disabled) inputRef.current?.focus();
  }

  return (
    <div className="passcode-field">
      <div className="passcode-boxes" onClick={focusInput} role="group" aria-labelledby={id}>
        <span id={id} className="sr-only">
          {label}
        </span>
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const filled = i < digits.length;
          const active = !disabled && digits.length < SLOT_COUNT && i === digits.length;
          return (
            <div
              key={i}
              className={`passcode-box${filled ? " filled" : ""}${active ? " active" : ""}`}
              aria-hidden
            >
              {filled ? "•" : ""}
            </div>
          );
        })}
        <input
          ref={inputRef}
          className="passcode-hidden-inp"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={SLOT_COUNT}
          autoComplete="one-time-code"
          value={digits}
          onChange={handleChange}
          disabled={disabled}
          aria-label={label}
        />
      </div>
      <div className="passcode-meta" aria-live="polite">
        <span className="passcode-meta-count">
          {digits.length} / {SLOT_COUNT} digits
        </span>
        <span className="passcode-meta-hint">Numbers only</span>
      </div>
    </div>
  );
}
