# Vencoder

A tool to interactively (re-)encode videos using FFmpeg.

Uses Neutralino.js and Solid.js.

This app _tries_ to imitate KDE's Kirigami UI framework, and also makes use of
Breeze icons

-   `./solid-src/src/assets/breeze[-dark]`: Icons used by TSX files
-   `./solid-src/public/breeze[-dark]`: Icons used by CSS files

## Running

In the project's root, To run a basic development setup, you'll need to do the
following first:

```
pnpm install -g @neutralinojs/neu
cd solid-src
pnpm install
```

Then, in seperate terminals, run `pnpm dev` in the `solid-src` directory and run
`neu run` in the project's root.

To build, In the project's root, Simply run:

```
cd solid-src
pnpm build
cd ..
neu build
```
