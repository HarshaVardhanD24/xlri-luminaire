import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import type { StartError } from '../utils/api';
import { isValidName, isValidRoll, normalizeName, normalizeRoll } from '../utils/roll';
import { alcomLogo } from './Brand';
import { PrivacyNote } from './PrivacyNote';

const ERRORS: Record<StartError, string> = {
  name: 'Please enter your name using letters only (2 to 60 characters).',
  invalid: 'That roll number does not look right. Use B26XXX, H26XXX, B25XXX or H25XXX.',
  already: 'This roll number has already played. It is one attempt per roll number. If this is a mistake, please speak to the Alumni Committee desk.',
  closed: 'The challenge is not open right now.',
  network: "Couldn't reach the server. Check your connection and try again.",
};

export function RollForm({ onStart, onBack, initialError }: { onStart: (roll: string, name: string) => Promise<StartError | null>; onBack: () => void; initialError?: StartError }) {
  const [value, setValue] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<StartError | null>(initialError ?? null);
  const roll = normalizeRoll(value);
  const nameOk = isValidName(name);
  const valid = isValidRoll(value) && nameOk;
  const rollOk = isValidRoll(value);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setErr(null);
    const r = await onStart(roll, normalizeName(name));
    if (r) setErr(r);
    setBusy(false);
  };

  return (
    <main className="one-view flex items-center justify-center px-4 sm:px-8">
      <form onSubmit={submit} className="glass rise w-full max-w-[560px] p-6 sm:p-10" noValidate>
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ivory">
            <img src={alcomLogo} alt="XLRI ALCOM" className="h-11 w-11" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold sm:text-[12px]">Before we begin</p>
        </div>

        <h1 className="mt-5 font-display text-[28px] font-medium leading-[1.12] text-ivory sm:text-[38px]" style={{ textWrap: 'balance' } as React.CSSProperties}>
          Tell us who's playing
        </h1>

        <label htmlFor="name" className="mt-5 block text-[12px] uppercase tracking-[0.2em] text-bluegrey">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErr(null);
          }}
          autoFocus
          autoComplete="name"
          maxLength={60}
          placeholder="Your full name"
          className="mt-2 w-full rounded-2xl border bg-[rgba(7,20,38,0.55)] px-5 py-3 text-[18px] text-ivory outline-none placeholder:text-bluegrey/60"
          style={{ borderColor: err === 'name' ? '#c77' : nameOk ? '#D8B978' : 'rgba(40,87,131,0.7)' }}
        />

        <label htmlFor="roll" className="mt-4 block text-[12px] uppercase tracking-[0.2em] text-bluegrey">
          Roll number
        </label>
        <input
          id="roll"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setErr(null);
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={10}
          placeholder="B26023"
          aria-invalid={value.length > 0 && !rollOk}
          aria-describedby="roll-help"
          className="mt-2 w-full rounded-2xl border bg-[rgba(7,20,38,0.55)] px-5 py-3 font-display text-[22px] tracking-[0.18em] text-ivory outline-none placeholder:text-bluegrey/60 sm:text-[28px]"
          style={{ borderColor: err && err !== 'name' ? '#c77' : rollOk ? '#D8B978' : 'rgba(40,87,131,0.7)' }}
        />
        <p id="roll-help" className="mt-2 text-[12.5px] text-bluegrey" style={{ color: '#8C9BB0' }}>
          Formats: B26XXX · H26XXX · B25XXX · H25XXX
        </p>
        {err && (
          <p className="mt-3 text-[13px] leading-snug text-[#f0a5a5]" role="alert">
            {ERRORS[err]}
          </p>
        )}

        <ul className="hide-short mt-4 space-y-2 text-[13px] text-bluegrey sm:text-[14px]" style={{ color: '#8C9BB0' }}>
          {['5 rounds, one try each · time recorded', 'One attempt per roll number'].map((p) => (
            <li key={p} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {p}
            </li>
          ))}
        </ul>

        <PrivacyNote className="hide-short mt-4" />

        <div className="mt-6 flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-[12px] uppercase tracking-[0.22em] text-bluegrey hover:text-ivory">
            <ArrowLeft size={14} /> Back
          </button>
          <button type="submit" disabled={!valid || busy} className="btn-gold px-8 sm:px-10">
            {busy ? (
              <>
                <span className="spinner" /> Starting…
              </>
            ) : (
              'Start the clock'
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
