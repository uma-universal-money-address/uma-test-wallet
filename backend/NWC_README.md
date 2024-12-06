# Running e2e NWC UMA Sandbox locally

First build the UMA Sandbox frontend:

```bash
cd uma-sandbox/frontend
yarn dev
```

Then run the UMA Sandbox backend:

```bash
QUART_CONFIG="local-dev.py" pipenv run quart run
```

Then run the uma-nwc-server app by following instructions here https://github.com/uma-universal-money-address/uma-nwc-server

Generate a client app ID if you haven't already using the [CLI tool](https://github.com/uma-universal-money-address/uma-auth-cli). First get a nostr keypair:

```bash
uma-auth-cli generate-key
```

The publish necessary events for app identity:

```bash
$ uma-auth-cli publish \
--nsec nsec1mqxnulkqkcv0gc0dfrxz5kz7d3h665ve2dhjkrj8jmmxwm4st2zsjv2n5l \
--relay wss://nos.lol --relay wss://relay.primal.net \
--redirect-uri https://foo.test \
--image https://foo.com/image.png \
--nip05 _@foo.com \
--name "Test CLI" \
--description "A test client app"
```

Now your client ID is your pubkey and relay like: `npub13msd7fakpaqerq036kk0c6pf9effz5nn5yk6nqj4gtwtzr5l6fxq64z8x5 wss://nos.lol`.

Now navigate to the nwc app login page in your browser:

`http://localhost:8080/oauth/auth?client_id=npub13msd7fakpaqerq036kk0c6pf9effz5nn5yk6nqj4gtwtzr5l6fxq64z8x5%20wss://nos.lol&required_commands=pay_invoice%20list_transactions&budget=1000&response_type=code&redirect_uri=http://localhost:8080/oauth/callback&code_challenge=a43f6ed&code_challenge_method=S256&state=foobar`
