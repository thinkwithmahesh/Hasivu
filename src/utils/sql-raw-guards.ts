/**
 * Runtime checks for legacy dynamic SQL helpers.
 * Live launch code should prefer Prisma model APIs or reviewed tagged templates.
 */

const DANGEROUS_MULTI_STATEMENT = /;\s*(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)\s/i;

/** True when query uses PostgreSQL-style numbered placeholders ($1, $2, …). */
function hasNumberedPlaceholders(query: string): boolean {
  return /\$\d+/.test(query);
}

/**
 * @throws Error when the query string looks unsafe for the given params.
 */
export function assertSafePostgresRawSql(query: string, params: unknown[]): void {
  if (DANGEROUS_MULTI_STATEMENT.test(query)) {
    throw new Error('SQL rejected: disallowed multi-statement pattern');
  }
  if (params.length > 0 && !hasNumberedPlaceholders(query)) {
    throw new Error(
      'SQL rejected: parameters were supplied but the query has no $1-style placeholders (possible injection or misuse)'
    );
  }
}
