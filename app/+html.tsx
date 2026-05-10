import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every
 * web page during static rendering.
 *
 * The contents of this function only run in Node.js environments and
 * do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 
          Disable body scrolling on web. This makes the image bounciness work like native.
          Can be combined with a full-screen height logic in your Root Layout.
        */}
        <ScrollViewStyleReset />

        {/* ── App Identity ─────────────────────────────── */}
        <title>eRoyal</title>
        <meta name="description" content="Royal City Housing Society Management App" />

        {/* ── Icons (Served from /public) ─────────────── */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        
        {/* ── PWA & iOS Safari Add to Home Screen ──────── */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D9488" />
        
        {/* iOS Specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="eRoyal" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Open Graph (WhatsApp/Social) */}
        <meta property="og:title" content="eRoyal" />
        <meta property="og:description" content="Royal City Housing Society Management" />
        <meta property="og:image" content="/apple-touch-icon.png" />

        {/* 
          Add any additional <head> elements that you want globally available on web...
        */}
      </head>
      <body>{children}</body>
    </html>
  );
}
