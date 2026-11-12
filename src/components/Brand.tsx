import alcomLogo from '../assets/alcom-logo.png';
import alumniLogo from '../assets/xlri-alumni-logo.png';

export { alcomLogo, alumniLogo };

/** Resolve a file in /public (e.g. approved portraits) for any hosting path. */
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

export function BrandBar({ compact = false }: { compact?: boolean }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="rounded-xl bg-ivory/95 px-3 py-1.5 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.6)]">
        <img src={alumniLogo} alt="XLRI Alumni" className={compact ? 'h-7 w-auto' : 'h-8 w-auto sm:h-10'} />
      </div>
      <div className="flex items-center gap-2.5">
        <span className="hidden text-right text-[11px] leading-tight tracking-[0.2em] text-silver sm:block">
          HOMECOMING 2026
          <br />
          <span className="text-gold">5–6 DECEMBER</span>
        </span>
        <div className={`grid place-items-center rounded-full bg-ivory/95 ${compact ? 'h-10 w-10' : 'h-11 w-11 sm:h-12 sm:w-12'}`}>
          <img src={alcomLogo} alt="XLRI ALCOM" className={compact ? 'h-9 w-9' : 'h-10 w-10 sm:h-11 sm:w-11'} />
        </div>
      </div>
    </header>
  );
}
