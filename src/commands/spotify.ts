import { Flags, CommandResponse, ResponseType } from "../event_handler";
import SpotifyClient from "../spotify";


type SpotifyCommandHandler = (user: string, message: string, flags: Flags, extra: any) => Promise<Response | void>;
type RewardHandler = (user: string, rewardId: string, message: string, extra: any) => Promise<Response | void>;

interface CommandMap {
    [key: string]: SpotifyCommandHandler;
}

interface RewardMap {
    [key: string]: RewardHandler;
}


function animatedDiv(text: string) {
    const div = document.createElement('div');

    // right coordinate depends on length of text

    div.id = 'playing';
    div.style.backgroundColor  = 'white';
    div.style.color = 'black';
    div.style.fontSize = '24px';
    div.style.padding = '10px';
    div.style.borderRadius = '10px';
    div.style.zIndex = '1000';

    // reset opacity to 1
    div.style.opacity = '1';
    div.style.bottom = '0';
    div.style.right = (text.length / 2) + 'px';
    div.textContent = text;

    return div;
}

class SpotifyCommands {
    private spotifyClient: SpotifyClient;
    private commands: CommandMap = {
        'skip': this.onSkipSong.bind(this),
        'song': this.getCurrentSong.bind(this),
        'next': this.getNextSong.bind(this),
        'lookup': this.onFindSong.bind(this),
        'add': this.onAddSong.bind(this),
        'songcommands': this.onSongCommands.bind(this),
    };
    private rewards: RewardMap = {
        '1e9fe39f-2e7d-4f24-8a76-97e31fd6e065': this.onSkipSongReward.bind(this),
        '6006568f-5023-47b9-93c7-191596139370': this.onAddSongReward.bind(this),
        'b8981d1c-65db-466d-b335-34855badf054': this.onPauseSongReward.bind(this),
        '919846e7-2442-4f07-b8ae-fd4644e137dc': this.onResumeSongReward.bind(this),
    }

    constructor(spotifyClient: SpotifyClient) {
        this.spotifyClient = spotifyClient;
    }

    public getSpotifyCommands(): string[] {
        return Object.keys(this.commands);
    }

    public getSpotifyRewards(): string[] {
        return Object.keys(this.rewards);
    }

    public onSpotifyCommand(user: string, command: string, message: string, flags: Flags, extra: any) {
        const handler = this.commands[command];

        if (!handler) {
            console.log(`Unhandled command: ${command}`);
            return;
        }

        return handler(user, message, flags, extra);
    }

    public onSpotifyReward(user: string, rewardId: string, message: string, extra: any) {
        const handler = this.rewards[rewardId];

        if (!handler) {
            console.log(`Unhandled reward: ${rewardId}`);
            return;
        }

        return handler(user, rewardId, message, extra);
    }

    private async onSkipSongReward(user: string, rewardId: string, message: string, extra: any): Promise<void> {
        await this.spotifyClient.skipSong();
    }

    private async onSkipSong(user: string, message: string, flags: Flags, extra: any): Promise<CommandResponse | void> {
        if (flags.broadcaster || flags.mod) {
            await this.spotifyClient.skipSong();
            return;
        }

        return {
            type: ResponseType.Say,
            message: 'RIPBOZO command is not for you.',
        }
    }

    private async onAddSong(user: string, message: string, flags: Flags, extra: any): Promise<CommandResponse | void> {
        if (flags.broadcaster || flags.mod) {
            const addedSong = await this.spotifyClient.addToQueue(message);

            if (!addedSong) {
                return {
                    type: ResponseType.Say,
                    message: `No song found for: ${message}`,
                }
            }

            return {
                type: ResponseType.Say,
                message: `Added ${addedSong.name} to the queue.`,
            }
        }

        return {
            type: ResponseType.Say,
            message: 'RIPBOZO command is not for you.',
        }
    }

    private async getCurrentSong(): Promise<CommandResponse> {
        const song = await this.spotifyClient.getCurrentSong();

        if (!song) {
            return {
                type: ResponseType.Say,
                message: 'No song is currently playing',
            }
        }

        const songString = `${song.name} by ${song.artists.join(', ')}`;

        // get a div with an id "playing"; if it doesn't exist, add it.
        // this div should be at the bottom righthand corner of the screen
        // and should contain text that says "Now Playing: <song name>"
        let playingDiv = document.getElementById('playing');

        // if it doesn't exist in the dom, create it
        if (!playingDiv) {
            const div = animatedDiv(`Now Playing: ${songString}`);

            document.body.appendChild(div);
            div.addEventListener('animationend', () => {
                console.log('animation ended');
                div.remove(); // remove the div from the DOM
            });
        }

        return {
            type: ResponseType.Say,
            message: `Now playing: ${songString}`,
        }
    }

    private async getNextSong(): Promise<CommandResponse> {
        const song = await this.spotifyClient.getNextSong();

        if (!song) {
            return {
                type: ResponseType.Say,
                message: 'There are no songs in the queue.',
            }
        }

        const songString = `${song.name} by ${song.artists.join(', ')}`;

        return {
            type: ResponseType.Say,
            message: `Playing Next: ${songString}`,
        }
    }

    private async onFindSong(user: string, message: string, flags: Flags, extra: any): Promise<CommandResponse> {
        const song = await this.spotifyClient.findSong(message);

        if (!song) {
            return {
                type: ResponseType.Say,
                message: `No song found for: ${message}`,
            }
        }

        const songString = `${song.name} by ${song.artists.join(', ')} on the album ${song.album}`;

        return {
            type: ResponseType.Say,
            message: `Found: ${songString}`,
        }
    }
    
    private async onSongCommands(user: string, message: string, flags: Flags, extra: any): Promise<CommandResponse> {
        // add a ! to the beginning of each command and join them with a space and comma
        return {
            type: ResponseType.Say,
            message: this.getSpotifyCommands().map((command) => `!${command}`).join(', '),
        }
    }

    private async onAddSongReward(user: string, rewardId: string, message: string, extra: any): Promise<CommandResponse> {
        const addedSong = await this.spotifyClient.addToQueue(message);
        const songString = `${addedSong.name} by ${addedSong.artists.join(', ')}`;

        if (!addedSong) {
            return {
                type: ResponseType.Say,
                message: `@${user} No song found for: ${message}; hopefully someone refunds you.`,
            }
        }

        return {
            type: ResponseType.Say,
            message: `@${user} Added ${songString} to the queue.`,
        }
    }

    private async onPauseSongReward(user: string, rewardId: string, message: string, extra: any): Promise<CommandResponse | void> {
        await this.spotifyClient.pauseSong();
    }

    private async onResumeSongReward(user: string, rewardId: string, message: string, extra: any): Promise<CommandResponse | void> {
        await this.spotifyClient.resumeSong();
    }

}


export default SpotifyCommands;