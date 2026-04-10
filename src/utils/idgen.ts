let counter = 0;

/** Generate a locally unique ID with an optional prefix */
export function generateId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}`;
}
