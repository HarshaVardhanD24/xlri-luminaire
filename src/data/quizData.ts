/**
 * PUBLIC quiz content. Contains questions and options only, never the answers.
 * Answers live in apps-script/Code.gs (live) and src/data/demoKey.ts (prototype only).
 */
export type SlotKind = 'blur' | 'wordsearch' | 'truths' | 'timeline' | 'emoji';

/** Every player sees these five formats in this order. */
export const SLOTS: { kind: SlotKind; title: string; blurb: string }[] = [
  { kind: 'blur', title: 'Guess the Pokémon', blurb: 'Name the blurred face' },
  { kind: 'wordsearch', title: 'The Crossword Challenge', blurb: 'Find the hidden word' },
  { kind: 'truths', title: 'Two Truths and One Lie', blurb: 'Spot the wrong statement' },
  { kind: 'timeline', title: 'Select the Timeline', blurb: 'Pick the right year' },
  { kind: 'emoji', title: 'Guess the Emoji', blurb: 'Decode the emojis' },
];

export interface BlurVariant {
  id: string;
  instruction: string;
  hint: string;
  options: string[];
  image: string; // blurred, safe to publish
  reveal: string; // shown only after a correct answer
}
export interface WordVariant {
  id: string;
  clue: string;
  grid: string[]; // one string per row
}
export interface TruthVariant {
  id: string;
  statements: { key: 'A' | 'B' | 'C'; text: string }[];
}
export interface TimelineVariant {
  id: string;
  question: string;
  min: number;
  max: number;
  start: number;
  markers: number[];
}
export interface EmojiVariant {
  id: string;
  emoji: string;
  options: string[];
}

export const BLUR: BlurVariant[] = [
  {
    id: 'p1',
    instruction: 'Identify the hidden XLRI alumna from the image.',
    hint: "Her journey began with one of India's biggest conglomerates before taking her to the helm of a global luxury brand.",
    options: ['Leena Nair', 'Anuradha Razdan', 'Madhavi Lall', 'Debrati Sen'],
    image: 'blur-p1.jpg',
    reveal: 'r-d4dfeecc99d4.jpg',
  },
  {
    id: 'p2',
    instruction: 'Identify the hidden XLRI alumnus from the image.',
    hint: 'His career took him through some of the world’s biggest consumer brands before reaching a historic global leadership role.',
    options: ['Sandeep Kataria', 'Sandeep Bakhshi', 'Chandramouli Venkatesan', 'Jaspal Bindra'],
    image: 'blur-p2.jpg',
    reveal: 'r-f2e56b320372.jpg',
  },
  {
    id: 'p3',
    instruction: 'Identify the hidden XLRI alumna from the image.',
    hint: 'She helped shape India’s presence in the global technology and consulting industry.',
    options: ['Rekha Menon', 'Anuradha Razdan', 'Debrati Sen', 'Madhavi Lall'],
    image: 'blur-p3.jpg',
    reveal: 'r-23cd31af3248.jpg',
  },
];

export const WORDS: WordVariant[] = [
  {
    id: 'w1',
    clue: 'Find the five-letter name of the investment platform co-founded by XLRI alumnus Ishan Bansal.',
    grid: ['QTMAPLZ', 'NGROWWX', 'BKDFSJH', 'CVYEUIA', 'PMNQTLR', 'SDGBKWF', 'CHXJAEO'],
  },
  {
    id: 'w2',
    clue: 'Find the nine-letter healthcare platform co-founded by XLRI alumnus Dhaval Shah.',
    grid: ['QTMAPLZNC', 'BHVXENRCD', 'TQLJWOPMR', 'HVCANBSQT', 'PHARMEASY', 'GHQVBDAPC', 'NRSTKMAYW', 'CPVLQXBYE', 'JMNCHTRPS'],
  },
  {
    id: 'w3',
    clue: 'Find the five-letter business process management company once led globally by XLRI alumnus Sandip Sen.',
    grid: ['QTMAPLZ', 'BHVXENR', 'TQLJWOP', 'HVAEGIS', 'PDKMSRX', 'GHQVBDA', 'NRSTKMA'],
  },
];

export const TRUTHS: TruthVariant[] = [
  {
    id: 't1',
    statements: [
      { key: 'A', text: 'Rakesh Kapoor led Reckitt Benckiser as its global CEO.' },
      { key: 'B', text: "Ajay Kaul founded Domino's Pizza India." },
      { key: 'C', text: 'B. Muthuraman served as Vice Chairman of Tata Steel and Tata Sons.' },
    ],
  },
  {
    id: 't2',
    statements: [
      { key: 'A', text: "Sandeep Bakhshi became ICICI Bank's MD and CEO in 2018." },
      { key: 'B', text: 'Chandramouli Venkatesan served as Managing Director of Mondelez India.' },
      { key: 'C', text: 'P.S. Jayakumar became MD and CEO of ICICI Bank in 2015.' },
    ],
  },
  {
    id: 't3',
    statements: [
      { key: 'A', text: "Jaspal Bindra led Standard Chartered's Asia-Pacific business." },
      { key: 'B', text: 'Debrati Sen is associated with 3M India as its Managing Director.' },
      { key: 'C', text: 'Madhavi Lall served as the CEO of Deutsche Bank India.' },
    ],
  },
];

export const TIMELINES: TimelineVariant[] = [
  { id: 'tl1', question: "In which year did Vikram Misri assume office as India's Foreign Secretary?", min: 2015, max: 2026, start: 2020, markers: [2015, 2026] },
  { id: 'tl2', question: 'In which year was Mindtree co-founded by XLRI alumnus Krishnakumar Natarajan?', min: 1990, max: 2005, start: 1997, markers: [1990, 2005] },
  { id: 'tl3', question: 'In which year was XSEED Education founded by XLRI alumnus Ashish Rajpal?', min: 2008, max: 2020, start: 2012, markers: [2008, 2020] },
];

export const EMOJIS: EmojiVariant[] = [
  {
    id: 'e1',
    emoji: '👩‍🦱 💧 🧴 ✨',
    options: ['Nikita Khanna — Moxie Beauty', 'Varun Alagh — Mamaearth', 'Ishan Bansal — Groww', 'Leena Nair — Chanel'],
  },
  {
    id: 'e2',
    emoji: '👨‍💼 🌱 🏫 📚',
    options: ['Vineet Nayar — Sampark Foundation', 'Sandeep Kataria — Bata', 'Krishnakumar Natarajan — Mindtree', 'K. Pandiarajan — Ma Foi Group'],
  },
  {
    id: 'e3',
    emoji: '👔 🤝 👥 🏢',
    options: ['K. Pandiarajan — Ma Foi Group', 'Sandip Sen — Aegis', 'Ashish Rajpal — XSEED Education', 'Rakesh Kapoor — Reckitt'],
  },
];

/** Variant ids per slot; the server picks one id per slot for every player. */
export const VARIANT_IDS: string[][] = [BLUR, WORDS, TRUTHS, TIMELINES, EMOJIS].map((l) => l.map((v) => v.id));
