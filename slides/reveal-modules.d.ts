declare module "reveal.js" {
  interface RevealOptions {
    [key: string]: unknown;
  }

  interface RevealDeck {
    initialize(): Promise<void> | void;
  }

  const Reveal: new (options?: RevealOptions) => RevealDeck;
  export default Reveal;
}

declare module "reveal.js/plugin/notes/notes.esm.js" {
  const Notes: unknown;
  export default Notes;
}
