/** Short, plain notice shown on the landing page, roll form and result. */
export const PRIVACY_TEXT =
  'To run the Homecoming challenge and give out perks, we record your name, roll number, your answers, your score and your total time in a Google Sheet. We use them only for this challenge and delete them after the event. We do not ask for your email or phone, and we do not store your IP address.';

export function PrivacyNote({ className = '' }: { className?: string }) {
  return <p className={`text-[11.5px] leading-relaxed text-bluegrey ${className}`}>{PRIVACY_TEXT}</p>;
}
