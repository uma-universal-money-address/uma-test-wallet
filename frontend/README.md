# UMA Test Wallet Frontend

The frontend component of the UMA Test Wallet, a demonstration and testing platform for UMA (Universal Money Address) integrations.

## Prerequisites

- Node.js (version specified in `.nvmrc`, currently using Node.js 18+)
- Yarn package manager
- Backend server running (see [Backend README](/backend/README.md))

## Setup and Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/uma-universal-money-address/uma-test-wallet.git
   cd uma-test-wallet/frontend
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

## Running the Application

### Development Mode

To run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

To create a production build:

```bash
yarn build
```

To start the production server:

```bash
yarn start
```

## PWA Support

This application supports Progressive Web App (PWA) functionality, allowing it to be installed and run like a native application.

### Testing on Desktop

To test local builds on desktop:
- Use Chrome (not Arc or other browsers)
- Look for the install button in the address bar
- Follow the prompts to install

### PWA Configuration

Most of the PWA functionality is configured through:
- `public/manifest.json` - App metadata and configuration
- `src/app/layout.tsx` - HTML metadata
- `next.config.ts` - Next.js configuration

If you make changes and Chrome no longer shows the option to install it, check your dev tools -> Applications -> Manifest for any misconfigurations.

## Environment variables

When building, set the NEXT_PUBLIC_BACKEND_DOMAIN which will get inlined into the js bundle, accessible to the browser. It should be configured to the domain of the backend, e.g. test.uma.me.
