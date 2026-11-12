export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: number;
  prompt: string;
  options: { key: OptionKey; text: string }[];
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    prompt: "You're given the opportunity to lead a completely new project. What's your first instinct?",
    options: [
      { key: 'A', text: 'Understand the people involved and bring everyone together.' },
      { key: 'B', text: 'Challenge the existing approach and do something different.' },
      { key: 'C', text: 'Develop a long-term roadmap before taking action.' },
      { key: 'D', text: 'Identify the opportunity and figure out how to turn it into something big.' },
    ],
  },
  {
    id: 2,
    prompt: 'What kind of achievement would make you most proud?',
    options: [
      { key: 'A', text: 'Building a workplace where people genuinely thrive.' },
      { key: 'B', text: 'Transforming an organisation that everyone thought was impossible to change.' },
      { key: 'C', text: 'Building something that continues to create value for decades.' },
      { key: 'D', text: 'Creating a business or product from an idea.' },
    ],
  },
  {
    id: 3,
    prompt: 'Your team is stuck on a difficult problem. What do you do?',
    options: [
      { key: 'A', text: "Understand everyone's perspectives and find common ground." },
      { key: 'B', text: 'Question the assumptions everyone else is accepting.' },
      { key: 'C', text: 'Break the problem down and create a structured solution.' },
      { key: 'D', text: 'Experiment with an unconventional solution.' },
    ],
  },
  {
    id: 4,
    prompt: 'Which professional superpower would you choose?',
    options: [
      { key: 'A', text: 'The ability to inspire and develop people.' },
      { key: 'B', text: 'The ability to predict opportunities before others see them.' },
      { key: 'C', text: 'The ability to turn a small idea into a massive organisation.' },
      { key: 'D', text: 'The ability to use technology to solve real-world problems.' },
    ],
  },
  {
    id: 5,
    prompt: 'Which environment would excite you the most?',
    options: [
      { key: 'A', text: 'A global organisation with diverse teams and cultures.' },
      { key: 'B', text: 'A fast-growing startup where every day brings a new challenge.' },
      { key: 'C', text: 'An established organisation undergoing major transformation.' },
      { key: 'D', text: 'A creative, collaborative environment where learning never stops.' },
    ],
  },
  {
    id: 6,
    prompt: 'Ten years from now, what would you most like people to remember you for?',
    options: [
      { key: 'A', text: 'The leader who helped people discover their potential.' },
      { key: 'B', text: 'The person who dared to challenge the status quo.' },
      { key: 'C', text: 'The visionary who built something that outlasted them.' },
      { key: 'D', text: "The innovator who created something the world hadn't seen before." },
    ],
  },
];
