export interface Level {
  id: number;
  title: string;
  status: 'locked' | 'active' | 'completed';
  position: 'left' | 'center' | 'right';
}

export const MOCK_LEVELS: Level[] = [
  { id: 1, title: "Intro to Go", status: 'completed', position: 'center' },
  { id: 2, title: "Variables", status: 'completed', position: 'left' },
  { id: 3, title: "Functions", status: 'active', position: 'right' },
  { id: 4, title: "Structs", status: 'locked', position: 'center' },
  { id: 5, title: "Interfaces", status: 'locked', position: 'left' },
  { id: 6, title: "Concurrency", status: 'locked', position: 'right' },
  { id: 7, title: "Channels", status: 'locked', position: 'center' },
];
