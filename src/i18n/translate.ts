/**
 * Replaces `{placeholder}` tokens in a template string with values from `vars`.
 * Unknown placeholders are left untouched.
 */
export function formatTemplate(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}
