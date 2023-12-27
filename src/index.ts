import { EventHandler } from "./event_handler";
import { TTSHandler } from "./tts";
import { Configuration } from "./config";
import SpotifyClient from "./spotify";
import SpotifyCommands from "./commands/spotify";
import "./styles.css";


interface MainOpts {
    twitchToken: string;
}

async function onError(error: Error | string) {
    const errorDiv = document.getElementById('error');
    let errorText = '';

    if (typeof error === 'string') {
        errorText = error;
    } else {
        errorText = error.message;
    }

    if (errorDiv.children.length == 0) {
        const h1 = document.createElement('h1');

        h1.style.color = '#ff0000';
        h1.textContent = 'Something went wrong';

        errorDiv.appendChild(h1);
    }

    const errorP = document.createElement('p');
    // make font size larger; at least 72px
    errorP.style.color = '#ff0000';
    errorP.textContent = errorText;
    errorP.style.fontSize = '72px';

    errorDiv.appendChild(errorP);

    console.error(error);
}

async function setupMain() {
    const urlParams = new URLSearchParams(window.location.search);
    const twitchToken = urlParams.get('twitchToken');
    let spotifyRefreshToken = urlParams.get('spotifyRefreshToken');

    if (!twitchToken) {
        onError('Missing twitchToken!');
        return;
    }

    const storedTwitchToken = localStorage.getItem('spotifyRefreshToken');

    if (!storedTwitchToken && !spotifyRefreshToken) {
        onError('Missing spotifyRefreshToken! This needs to be provided in the URL once');
        return;
    }

    if (!storedTwitchToken && spotifyRefreshToken) {
        localStorage.setItem('spotifyRefreshToken', spotifyRefreshToken);
    }

    return main({
        twitchToken,
    });
}

async function main(opts: MainOpts) {
    const eventHandler = new EventHandler(opts.twitchToken, Configuration.CHANNEL);
    const ttsHandler = new TTSHandler();

    const spotifyClient = new SpotifyClient(Configuration.SPOTIFY_CLIENT_ID);
    const SpotifyCommandHandler = new SpotifyCommands(spotifyClient);

    // setup the spotify client
    await spotifyClient.setup();

    // register the tts handler
    eventHandler.registerRewardsHandler(ttsHandler.getSpeakerIds(), ttsHandler.handleReward.bind(ttsHandler));
    eventHandler.registerRewardHandler(ttsHandler.skipTTSId, ttsHandler.handleSkipTTS.bind(ttsHandler));
    eventHandler.registerRewardHandler(ttsHandler.randomTTSId, ttsHandler.handleRandomTTS.bind(ttsHandler));

    // register the spotify command handler
    eventHandler.registerCommandsHandler(SpotifyCommandHandler.getSpotifyCommands(), SpotifyCommandHandler.onSpotifyCommand.bind(SpotifyCommandHandler));
    eventHandler.registerRewardsHandler(SpotifyCommandHandler.getSpotifyRewards(), SpotifyCommandHandler.onSpotifyReward.bind(SpotifyCommandHandler));
}


// Only run the code if the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await setupMain();
});


// catch unhandled errors
window.addEventListener('error', (error: ErrorEvent) => {
    console.log(error)
    onError(error.error);
});

export {
    onError,
}