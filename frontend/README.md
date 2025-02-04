# UMA Sandbox Frontend

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## PWA

In order to test local builds on desktop, make sure to use Chrome (Arc doesn't work) and look for the download button in the search bar.

Most of it is configured through the public/manifest.json, metadata in src/app/layout.tsx, and the next.config.ts.

If you make changes and Chrome no longer shows the option to install it, check your dev tools -> Applications -> Manifest for any misconfigurations.

## Environment variables

When building, set the NEXT_PUBLIC_BACKEND_DOMAIN which will get inlined into the js bundle, accessible to the browser. It should be configured to the domain of the backend, e.g. test.uma.me.
