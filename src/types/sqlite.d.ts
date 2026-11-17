declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      get(...params: (string | number | null)[]): unknown;
      run(...params: (string | number | null)[]): unknown;
      all(...params: (string | number | null)[]): unknown[];
    };
  }
}
