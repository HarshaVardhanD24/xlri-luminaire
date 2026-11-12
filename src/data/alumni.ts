export type AlumniId = 'LEE' | 'VIN' | 'MUT' | 'PAN' | 'BHA' | 'SEN' | 'VAR' | 'CHA' | 'NIK';

export interface Alumnus {
  id: AlumniId;
  name: string;
  initials: string;
  archetype: string;
  /** Shown on the result page. Leave '' if not yet verified. */
  education: string;
  /** Verified career highlights, one per line. */
  highlights: string[];
  traits: string[];
  headline: string;
  body: string;
  inspiration: string;
  /**
   * Approved portrait only. Drop the file into /public/portraits/ with this exact name
   * (square-ish JPG, ~600 px). If the file is missing, an initials medallion is shown.
   */
  portrait?: string;
}

// EDITORIAL: verify every education line, title and date before launch (brief, Section 17).
export const ALUMNI: Record<AlumniId, Alumnus> = {
  LEE: {
    id: 'LEE',
    portrait: 'portraits/leena-nair.jpg',
    name: 'Leena Nair',
    initials: 'LN',
    archetype: 'The People-First Global Leader',
    education: 'XLRI PGDPMIR, 1992',
    highlights: ['Global CEO of Chanel', 'Former Chief Human Resources Officer, Unilever'],
    traits: [
      'People-centric leadership',
      'Empathy and emotional intelligence',
      'Global mindset',
      'Inclusive organisational culture',
      'Talent development',
      'Breaking traditional leadership barriers',
    ],
    headline: 'You believe extraordinary organisations are built by empowering extraordinary people.',
    body: 'You are drawn towards leadership opportunities where collaboration, empathy and ambition coexist. You value people as much as performance and want your success to create opportunities for others.',
    inspiration: "Leena Nair's journey from XLRI to global leadership at Chanel.",
  },
  VIN: {
    id: 'VIN',
    portrait: 'portraits/vineet-nayar.jpg',
    name: 'Vineet Nayar',
    initials: 'VN',
    archetype: 'The Disruptive Changemaker',
    education: 'XLRI Alumnus', // EDITORIAL: verify programme and year
    highlights: ['Former CEO, HCL Technologies', 'Founder, Sampark Foundation'],
    traits: [
      'Challenging conventional thinking',
      'Transformational leadership',
      'Employee empowerment',
      'Innovation',
      'Organisational change',
      'Questioning established systems',
    ],
    headline: 'You were never meant to simply follow the existing playbook.',
    body: 'You enjoy questioning assumptions, challenging traditional systems and creating new ways of doing things. You believe meaningful change begins when someone is willing to think differently.',
    inspiration: "Vineet Nayar's Employees First philosophy and organisational transformation journey.",
  },
  MUT: {
    id: 'MUT',
    portrait: 'portraits/b-muthuraman.jpg',
    name: 'B. Muthuraman',
    initials: 'BM',
    archetype: 'The Strategic Institution Builder',
    education: 'XLRI Alumnus', // EDITORIAL: verify programme and year
    highlights: ['Former Managing Director and Vice Chairman, Tata Steel', 'Former Chairman, XLRI'],
    traits: [
      'Long-term strategic thinking',
      'Operational excellence',
      'Institution building',
      'Disciplined execution',
      'Managing large-scale transformation',
      'Sustainable business growth',
    ],
    headline: 'You think beyond immediate wins.',
    body: 'You prefer structured decisions, sustainable growth and long-term impact. You enjoy building systems and institutions that continue creating value well into the future.',
    inspiration: "B. Muthuraman's leadership journey at Tata Steel.",
  },
  PAN: {
    id: 'PAN',
    portrait: 'portraits/k-pandiarajan.jpg',
    name: 'K. Pandiarajan',
    initials: 'KP',
    archetype: 'The Entrepreneurial Risk-Taker',
    education: 'XLRI PMIR, 1984',
    highlights: ['Founder, Ma Foi Management Consultants', 'Chairperson, CIEL HR'],
    traits: [
      'Entrepreneurial thinking',
      'Opportunity identification',
      'Calculated risk-taking',
      'Business development',
      'Building businesses',
      'People and talent solutions',
    ],
    headline: 'You see opportunities where others see uncertainty.',
    body: 'You enjoy building, experimenting and turning ideas into businesses. You are comfortable taking calculated risks when you believe the opportunity is worth pursuing.',
    inspiration: "K. Pandiarajan's entrepreneurial journey with Ma Foi and CIEL HR.",
  },
  BHA: {
    id: 'BHA',
    portrait: 'portraits/abhijit-bhaduri.jpg',
    name: 'Abhijit Bhaduri',
    initials: 'AB',
    archetype: 'The Creative People Strategist',
    education: 'XLRI PMIR, 1984',
    highlights: ['Former Chief Learning Officer, Wipro', 'Leadership author and speaker'],
    traits: [
      'Learning and development',
      'Storytelling',
      'Creative problem-solving',
      'Understanding human behaviour',
      'Developing organisational capabilities',
      'Future-ready talent development',
    ],
    headline: 'You see potential in people, ideas and possibilities.',
    body: 'You enjoy learning, communicating and understanding what motivates people. Your strength lies in combining creativity with a deep understanding of human behaviour.',
    inspiration: "Abhijit Bhaduri's work in leadership, learning and organisational development.",
  },
  SEN: {
    id: 'SEN',
    portrait: 'portraits/sandip-sen.jpg',
    name: 'Sandip Sen',
    initials: 'SS',
    archetype: 'The Global Business Driver',
    education: 'XLRI BM, 1989',
    highlights: ['Former Global CEO, Aegis'],
    traits: [
      'International business orientation',
      'Scaling businesses',
      'Commercial thinking',
      'Strategic execution',
      'Managing complex operations',
      'Growth-oriented leadership',
    ],
    headline: 'You are comfortable thinking beyond boundaries.',
    body: 'You enjoy understanding businesses at scale, navigating complex environments and converting strategy into execution. You are motivated by growth and measurable impact.',
    inspiration: "Sandip Sen's global business leadership journey.",
  },
  VAR: {
    id: 'VAR',
    portrait: 'portraits/varun-alagh.jpg',
    name: 'Varun Alagh',
    initials: 'VA',
    archetype: 'The Consumer-Focused Innovator',
    education: 'XLRI PGDM BM, 2007',
    highlights: ['Co-founder and CEO, Honasa Consumer', 'Brands include Mamaearth'],
    traits: [
      'Consumer-centric thinking',
      'Brand building',
      'Digital-first business models',
      'Innovation and experimentation',
      'Understanding market gaps',
      'Building scalable ventures',
    ],
    headline: 'You are fascinated by what people need before the market fully recognises it.',
    body: 'You enjoy spotting consumer trends, developing brands and building products that connect with real people. You combine commercial thinking with innovation.',
    inspiration: "Varun Alagh's journey building Honasa Consumer.",
  },
  CHA: {
    id: 'CHA',
    portrait: 'portraits/chaitanya-peddi.jpg',
    name: 'Chaitanya Peddi',
    initials: 'CP',
    archetype: 'The Tech-Driven Problem Solver',
    education: 'XLRI PMIR, 2012',
    highlights: ['Co-founder, Darwinbox'],
    traits: [
      'Technology-led problem-solving',
      'Product thinking',
      'Entrepreneurial execution',
      'Understanding workplace challenges',
      'Building scalable solutions',
      'Challenging traditional HR systems',
    ],
    headline: 'You believe complex problems deserve smarter solutions.',
    body: 'You enjoy combining technology, product thinking and practical execution to create solutions that can scale. You are drawn towards the intersection of people, business and technology.',
    inspiration: "Chaitanya Peddi's journey building Darwinbox.",
  },
  NIK: {
    id: 'NIK',
    portrait: 'portraits/nikita-khanna.jpg',
    name: 'Nikita Khanna',
    initials: 'NK',
    archetype: 'The Consumer-Obsessed Entrepreneur',
    education: 'XLRI PGDM, 2014–2016',
    highlights: ['Founder, Moxie Beauty, with co-founder Anmol Ahlawat', 'Former McKinsey consultant'],
    traits: [
      'Identifying overlooked consumer problems',
      'Turning personal experiences into business opportunities',
      'Consumer-centric innovation',
      'Analytical and strategic thinking',
      'Building differentiated brands',
      'Calculated entrepreneurial risk-taking',
    ],
    headline: 'You notice the problems people have learned to live with, and imagine how things could be better.',
    body: 'You combine analytical thinking with curiosity about real consumer experiences. You enjoy identifying underserved needs and turning insights into products and businesses.',
    inspiration: "Nikita Khanna's journey from consulting to building Moxie Beauty around the needs of Indian hair types.",
  },
};

/** Fixed order used only as the very last tie-break fallback. */
export const ALUMNI_ORDER: AlumniId[] = ['LEE', 'VIN', 'MUT', 'PAN', 'BHA', 'SEN', 'VAR', 'CHA', 'NIK'];
