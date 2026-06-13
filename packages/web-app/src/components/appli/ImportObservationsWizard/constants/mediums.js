// Source of truth: GrottoCenter API database (t_medium table).
// If the backend adds a new medium, this file must be updated manually.
// TODO: Consider fetching these from an API endpoint to avoid drift.
export const MEDIUMS = [
  { id: 1, code: 'water' },
  { id: 2, code: 'air' },
  { id: 3, code: 'soil' },
  { id: 4, code: 'sediment' },
  { id: 5, code: 'cave_wall' }
];
