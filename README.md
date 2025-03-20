# UMA Test Wallet

A webapp used for demonstrating and testing UMA (Universal Money Address) integrations.

## Project Overview

The UMA Test Wallet is designed to be a comprehensive tool for both users and developers in the UMA ecosystem. You can find the deployed version at [https://test.uma.me](https://test.uma.me). This project serves multiple roles:

### 1. Educational Resource
- Helps users build their understanding of UMA payment flows and UX through frictionless first-hand interactions
- Provides a sandbox environment to safely experiment with UMA features
- Demonstrates the simplicity and power of UMA payments in a practical context

### 2. UX Best Practices Showcase
- Highlights UX best practices and our recommendations for entry and payment experiences
- Demonstrates flows for sending/receiving payments

### 3. Developer Testing Environment
- Provides a Wallet for developers to develop and test against (e.g., UMA Auth VASP for UMA Auth client developers)
- Serves as a reference implementation of both sending and receiving VASP functionality
- Enables testing of integration points without needing to set up complex infrastructure

### 4. Code Reference
- Provides copy-and-pasteable sample code for implementing UMA features
- Demonstrates practical implementations of the UMA protocol specifications
- Shows how to handle common scenarios and edge cases in UMA implementations

## Technical Architecture

The project consists of two main components:

- **Frontend**: A modern web application built with Next.js, React, and Tailwind CSS that provides the user interface for the wallet
- **Backend**: A Flask-based Python server that implements the UMA protocol, including sending and receiving VASP functionality

Both components are designed to be run locally for development or deployed to a production environment.

## Getting Started

See the respective README files in the frontend and backend directories for detailed instructions on setting up and running each component:

- [Frontend README](/frontend/README.md)
- [Backend README](/backend/README.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the terms found in the [LICENSE](/LICENSE) file.

