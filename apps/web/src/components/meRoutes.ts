export type MeDimension = 'personal' | 'team';

export function meHomePath(dim: MeDimension = 'personal') {
  return dim === 'team' ? '/me?dim=team' : '/me?dim=personal';
}

export function inferMeDimension(pathname: string): MeDimension {
  return pathname.startsWith('/me/team') ? 'team' : 'personal';
}
