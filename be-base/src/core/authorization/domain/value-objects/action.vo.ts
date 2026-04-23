export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'publish'
  | 'approve'
  | 'export';

export const ALL_ACTIONS: Action[] = [
  'create',
  'read',
  'update',
  'delete',
  'publish',
  'approve',
  'export',
];
