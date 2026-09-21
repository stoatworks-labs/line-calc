import type { ReactNode } from 'react';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <em className="field__hint">{hint}</em>}
    </label>
  );
}

/**
 * A number input that keeps the user's keystrokes while they type.
 *
 * Committing on every change means clearing the box to retype sends NaN downstream and
 * the layout jumps to "—" mid-edit; committing only on blur loses the last edit when the
 * user clicks straight onto another control. This commits valid numbers immediately and
 * simply ignores the transient invalid states, which is what both of those want.
 */
export function Num({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <span className="num">
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = e.currentTarget.valueAsNumber;
          if (!Number.isFinite(n)) return;
          onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
        }}
      />
      {suffix && <span className="num__suffix">{suffix}</span>}
    </span>
  );
}

export function Stat({
  label,
  value,
  note,
  tone = 'plain',
  big = false,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: 'plain' | 'ok' | 'warn' | 'bad' | 'data' | 'power';
  big?: boolean;
}) {
  return (
    <div className={`stat stat--${tone}${big ? ' stat--big' : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {note && <span className="stat__note">{note}</span>}
    </div>
  );
}

export function Bar({ fraction, tone }: { fraction: number; tone: 'data' | 'power' }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className={`bar bar--${tone}`} role="presentation">
      <span className="bar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
