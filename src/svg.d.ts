// SVG files are imported as raw text via esbuild's text loader (see the
// `loader` option in angular.json). Each import resolves to the file's markup.
declare module '*.svg' {
  const content: string;
  export default content;
}
