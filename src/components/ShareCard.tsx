import { Check, Download, Link2, Loader2, RotateCcw, Share2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Alumnus } from '../data/alumni';
import { track } from '../utils/analytics';
import { generateShareCard } from '../utils/generateShareCard';

interface Props {
  alumnus: Alumnus;
  onClose: () => void;
  onRetake: () => void;
}

export function ShareCard({ alumnus, onClose, onRetake }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState('');

  // Link to the quiz home only: never encodes the user's answers.
  const siteUrl = `${window.location.origin}${window.location.pathname}`;
  const shareText = `I resonate with ${alumnus.name}, ${alumnus.archetype}. Which XLRI legend are you? #XLRIHomecoming #XLRIAlumni #MyXLRIStory`;
  const fileName = `my-xlri-legacy-${alumnus.name.toLowerCase().replace(/[^a-z]+/g, '-')}.png`;

  useEffect(() => {
    let objectUrl = '';
    generateShareCard(alumnus, import.meta.env.BASE_URL).then((b) => {
      objectUrl = URL.createObjectURL(b);
      setBlob(b);
      setUrl(objectUrl);
    });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [alumnus, onClose]);

  const download = (silent = false) => {
    if (!url) return;
    if (!silent) track('share', { label: 'download' });
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  const share = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My XLRI Legacy Match', text: shareText });
        track('share', { label: 'native' });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'My XLRI Legacy Match', text: shareText, url: siteUrl });
        track('share', { label: 'native' });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    download();
    setNote('Sharing is not supported here, so the card was downloaded instead.');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
    } catch {
      const t = document.createElement('textarea');
      t.value = siteUrl;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    track('share', { label: 'copy' });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/85 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Share your XLRI legacy"
      onClick={onClose}
    >
      <div
        className="fadein relative max-h-[100svh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-deep p-5 pb-7 sm:rounded-3xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow">Share your legacy</p>
          <button onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full text-silver hover:text-ivory">
            <X size={20} />
          </button>
        </div>

        <div className="mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-xl border border-line bg-midnight shadow-[0_20px_60px_-20px_rgba(216,185,120,0.4)]">
          {url ? (
            <img src={url} alt={`Share card: ${alumnus.name}, ${alumnus.archetype}`} className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full place-items-center text-silver">
              <Loader2 className="animate-spin" />
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button onClick={share} disabled={!blob} className="btn-gold">
            <Share2 size={17} /> Share
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => download()} disabled={!blob} className="btn-ghost px-3 text-[13px]">
              <Download size={16} /> Download
            </button>
            <button onClick={copy} className="btn-ghost px-3 text-[13px]">
              {copied ? <Check size={16} className="text-[#8FC8AC]" /> : <Link2 size={16} />} {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <button onClick={onRetake} className="inline-flex min-h-11 items-center justify-center gap-2 text-sm text-silver hover:text-ivory">
            <RotateCcw size={15} /> Retake the quiz
          </button>
          {note && <p className="text-center text-xs text-[#E6B77A]">{note}</p>}
        </div>
      </div>
    </div>
  );
}
