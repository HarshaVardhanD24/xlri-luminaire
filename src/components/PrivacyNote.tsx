/** Short, plain notice of what Luminaire records. Shown on the landing page, quiz intro and result. */
export const PRIVACY_TEXT =
  'We record anonymous page loads and your quiz choices, result and shares (with the time, device type, the QR code you scanned and a random code for this browser tab) to see how Homecoming visitors use Luminaire. We never ask for or store your name, email, phone or roll number.';

export function PrivacyNote({ className = '' }: { className?: string }) {
  return <p className={`text-[11.5px] leading-relaxed text-bluegrey ${className}`}>{PRIVACY_TEXT}</p>;
}
