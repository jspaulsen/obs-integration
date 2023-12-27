const axios = require('axios');
const express = require('express');
// const open = require('open');
// import open from 'open';

let open = null;

const SCOPES = [
    'user-modify-playback-state',
    'user-read-playback-state',
];

const CLIENT_ID = "c47877614f4e4632b293a40fe7a260e2";


function randomCodeVerifier() {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = crypto.getRandomValues(new Uint8Array(64));
    const randomString = randomValues.reduce((acc, x) => acc + possible[x % possible.length], "");

    return randomString;
}

function base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

async function generateAuthUrl(clientId, scopes, redirectUri, codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const hashed = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = base64encode(hashed);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        scope: scopes,
    });

    authUrl.search = params.toString();

    return authUrl.toString();
}


async function exchangeCodeForToken(code, clientId, redirectUri, codeVerifier) {
    const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        params: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: codeVerifier,
        },
    });

    return response.data;
}


async function main() {
    const clientId = process.env.SPOTIFY_CLIENT_ID ? process.env.SPOTIFY_CLIENT_ID : CLIENT_ID;
    const scopes = SCOPES.join(' ');
    const redirectUri = 'http://localhost:3000/callback';
    const app = express();

    let waitingForCallback = true;
    let server = null;
    let code = null;
    
    //dynamic import open
    const dynImport = await import('open');
    open = dynImport.default;

    // define a callback endpoint /callback
    app.get('/callback', (req, res) => {
        code = req.query.code;
        
        if (!code || req.query.error) {
            if (req.query.error) {
                console.error(req.query.error);
                res.send(req.query.error);
            } else {
                res.send('No code provided (something went wrong)');
            }

            return;
        }

        console.log('Got code:', code);
        res.send("Code Received. You can close this tab now.");

        waitingForCallback = false;
        server.close();
    });

    // listen to port 3000
    server = app.listen(3000, () => { console.log('Server listening on port 3000!') });

    const codeVerifier = randomCodeVerifier();
    const authUrl = await generateAuthUrl(clientId, scopes, redirectUri, codeVerifier);

    // open the auth url in the browser
    await open(authUrl);

    // wait for the callback
    while (waitingForCallback) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // exchange the code for a token
    const tokenResponse = await exchangeCodeForToken(
        code,
        clientId,
        redirectUri,
        codeVerifier,
    );

    console.log(`Access Token: ${tokenResponse.access_token}`);
    console.log(`Refresh Token: ${tokenResponse.refresh_token}`);

    // explicitly exit the process
    process.exit(0);
}


(async () => {
    await main()
})();



// const code_verifier = randomString;
// const data = new TextEncoder().encode(code_verifier);
// const hashed = await crypto.subtle.digest('SHA-256', data);

// const code_challenge_base64 = btoa(String.fromCharCode(...new Uint8Array(hashed)))
//   .replace(/=/g, '')
//   .replace(/\+/g, '-')
//   .replace(/\//g, '_');
