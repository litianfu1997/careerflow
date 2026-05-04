const VALID_SCOPES = [
  "resume:read",
  "resume:write_patch",
  "resume:export",
  "resume:version",
  "resume:apply_patch",
  "resume:delete",
  "profile:write",
] as const;

export type Scope = (typeof VALID_SCOPES)[number];

export const DEFAULT_SCOPES: Scope[] = [
  "resume:read",
  "resume:write_patch",
  "resume:export",
  "resume:version",
];

export function isValidScope(scope: string): scope is Scope {
  return VALID_SCOPES.includes(scope as Scope);
}

export function hasScope(scopes: string[], required: Scope): boolean {
  return scopes.includes(required);
}

export function validateScopes(scopes: string[]): { valid: boolean; invalid: string[] } {
  const invalid = scopes.filter((s) => !isValidScope(s));
  return { valid: invalid.length === 0, invalid };
}
