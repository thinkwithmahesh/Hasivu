import { assertSafePostgresRawSql } from '../../../src/utils/sql-raw-guards';

describe('assertSafePostgresRawSql', () => {
  it('allows static statements with no parameters', () => {
    expect(() => assertSafePostgresRawSql('BEGIN', [])).not.toThrow();
    expect(() => assertSafePostgresRawSql('COMMIT', [])).not.toThrow();
    expect(() => assertSafePostgresRawSql('ROLLBACK', [])).not.toThrow();
  });

  it('allows parameterized queries', () => {
    expect(() =>
      assertSafePostgresRawSql('SELECT id FROM orders WHERE id = $1', ['uuid-here'])
    ).not.toThrow();
  });

  it('rejects params without placeholders', () => {
    expect(() => assertSafePostgresRawSql('SELECT * FROM orders WHERE id = ?', ['x'])).toThrow(
      /no \$1-style placeholders/
    );
  });

  it('rejects suspicious multi-statement patterns', () => {
    expect(() =>
      assertSafePostgresRawSql('SELECT 1; DROP TABLE users;', [])
    ).toThrow(/multi-statement/);
  });
});
