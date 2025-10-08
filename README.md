# Vencoder

A tool to interactively (re-)encode videos using FFmpeg.

Uses Neutralino.js and Solid.js.

This app _tries_ to imitate KDE's Kirigami UI framework, and also makes use of
Breeze icons (Located in `./solid-src/public/breeze[-dark]`)

Vencoder is tested with FFmpeg 8.0, should be compatible with older versions
but is not guaranteed.

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

## Unimplemented Features

The Settings page doesn't work yet.

## Encoder Support

Vencoder will only support predefined options for "common" codecs. What is
considered common depends solely on the needs of the program's users.

Note that, not all of these encoders will show up in the program. Only the
encoders supported by your FFmpeg install will show up.

-   [x] AV1
    -   [x] libaom-av1
    -   [x] librav1e (Partial support)
    -   [x] libsvtav1
    -   [ ] av1_amf
    -   [ ] av1_nvenc
    -   [ ] av1_qsv
    -   [ ] av1_vaapi
-   [x] DNxHD (Does not provide options to deal with its pickiness yet)
-   [x] H.264
    -   [x] libx264
    -   [x] libx264rgb (Untested, but _should_ work)
    -   [ ] h264_amf
    -   [ ] h264_nvenc
    -   [x] h264_qsv
    -   [ ] h264_vaapi
    -   [ ] h264_vulkan
-   [x] H.265
    -   [x] libx265
    -   [ ] h265_amf
    -   [ ] h265_nvenc
    -   [x] h265_qsv
    -   [ ] h265_vaapi
    -   [ ] h265_vulkan
-   [x] VP9
    -   [ ] libvpx-vp9
    -   [ ] vp9_vaapi
    -   [x] vp9_qsv (Really Basic)

