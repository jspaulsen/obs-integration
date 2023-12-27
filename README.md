# OBS Integration
OBS Spotify + TTS Integration

## Twitch Token

This application requires a twitch token. You can use the following to generate one: https://twitchapps.com/tokengen/

* Client id: x4ialb6ptemxp1pgyyytyckgme7qp7
* Scopes: channel:manage:redemptions channel:read:redemptions user:read:email chat:edit chat:read

## Spotify Token

A Spotify (refresh) token is required for the application. A client id is already provided for this script, but can be overriden via `SPOTIFY_CLIENT_ID`. *NOTE:* If you override the default client id, you must specify the client id as an argument to the browser source.

### Install (dev) Dependencies

In order to run the script, you must install both dev and application dependencies.

### Generating the Token

Once the environment is setup, you can generate a token via `npm run spotify:token`. This will open a browser and prompt you to authorize the application.

## OBS

Two tokens must be provided to the application via query parameters. This will look (effectively) like this:

> C:/Users/Documents/obs/integration/index.html?twitchToken=abc123&spotifyRefreshToken=abc123

When adding as a browser source, *DO NOT* use the `local file` option, but instead as a "url".