declare module 'xss-clean' {
  interface Options {
    level?: number;
    allowedTags?: string[];
    allowedAttributes?: { [tag: string]: string[] };
    disallowedTagsMode?: 'recursiveEscape' | 'escape' | 'recursiveEscapeWithAllowedTags';
  }

  function xss(options?: Options): (req: any, res: any, next: any) => void;

  export = xss;
}
