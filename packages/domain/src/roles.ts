/**
 * User roles. Modeled as a plain string union (not a fixed two-value enum) so future
 * roles (e.g. OWNER, TENANT for a later portal) extend this list without a schema rewrite.
 */
export const ROLES = ["ADMIN", "FIELD_STAFF"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
