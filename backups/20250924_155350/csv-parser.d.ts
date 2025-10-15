declare module 'csv-parser' {
  import { Transform } from 'stream';

  interface CsvParserOptions {
    headers?: boolean | string[];
    skipEmptyLines?: boolean;
    mapHeaders?: (header: string) => string;
    mapValues?: (value: string, index: number) => any;
    separator?: string;
    quote?: string;
    escape?: string;
    newline?: string;
    strict?: boolean;
    discardUnmappedColumns?: boolean;
    asObject?: boolean;
  }

  function csvParser(options?: CsvParserOptions): Transform;
  export = csvParser;
}
