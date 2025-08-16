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

## Gitea Actions

If you saw this line:

```
wget https://staticlines.dailitation.xyz/neutralinojs-v6.2.0.zip
```

Before anyone asks about it, it is an unmodified copy from the GitHub Releases
page of Neutralinojs. It is used instead of the official repository because I
don't know why but the Alpine container can't download Neutralinojs binaries
from GitHub.
