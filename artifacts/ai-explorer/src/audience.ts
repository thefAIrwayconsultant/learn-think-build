export const ageBands = [
  {
    id: '10-12',
    label: 'Ages 10–12',
    pathName: 'Curious Starter',
    description: 'Start with clear examples, simple language, and guided practice.',
  },
  {
    id: '13-15',
    label: 'Ages 13–15',
    pathName: 'Thoughtful Explorer',
    description: 'Explore tradeoffs, source-checking, school scenarios, and project choices.',
  },
  {
    id: '16-plus',
    label: 'Ages 16+',
    pathName: 'Independent Builder',
    description: 'Work through deeper concepts, stronger evaluation, and responsible design.',
  },
] as const;

export type AgeBand = (typeof ageBands)[number]['id'];

export function getAgeBand(id: string | null | undefined) {
  return ageBands.find((band) => band.id === id) ?? null;
}
