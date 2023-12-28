import { SpotifyApi, AccessToken, Track as SpotifyTrack } from '@spotify/web-api-ts-sdk';
import { onError } from '.';


interface Track {
    name: string;
    uri: string;
    album: string;
    artists: string[];
}

class SpotifyClient {
    private refreshToken: string;
    private clientId: string;
    private api: SpotifyApi;
    private refreshTokenInterval: NodeJS.Timeout;

    constructor(clientId: string) {
        this.refreshToken = localStorage.getItem('spotifyRefreshToken');
        this.clientId = clientId;
    }

    public async setup(): Promise<void> {
        if (this.api) {
            return;
        }

        const accessToken = await this.refreshAccessToken();

        if (!accessToken.access_token) {
            return;
        }

        // set the refresh token in local storage
        localStorage.setItem('spotifyRefreshToken', accessToken.refresh_token);
        this.refreshToken = accessToken.refresh_token;

        this.api = SpotifyApi.withAccessToken(
            this.clientId,
            accessToken
        );
        
        // setup an interval to refresh the access token that is 2 minutes shorter than the actual expiration
        // so that we don't have to wait for the refresh to complete before making requests
        this.refreshTokenInterval = setInterval(async () => {
            const accessToken = await this.refreshAccessToken();

            if (!accessToken.access_token) {
                return;
            }

            localStorage.setItem('spotifyRefreshToken', accessToken.refresh_token);
            this.refreshToken = accessToken.refresh_token;
            
            this.api = SpotifyApi.withAccessToken(
                this.clientId,
                accessToken
            );
            
        }, (accessToken.expires_in - 120) * 1000);
    }

    public async getQueue(): Promise<string[]> {
        const queue = await this.api.player.getUsersQueue();

        return queue.queue.map((track) => track.name);
    }

    public async getNextSong(): Promise<Track> {
        const queue = await this.api.player.getUsersQueue();

        if (queue.queue.length === 0) {
            return null;
        }

        const track: SpotifyTrack = queue.queue[0] as SpotifyTrack;

        return {
            name: track.name,
            album: track.album.name,
            artists: track.artists.map((artist) => artist.name),
            uri: track.uri,
        };
    }

    public async getCurrentSong(): Promise<Track | null> {
        const playbackState = await this.api.player.getCurrentlyPlayingTrack();

        if (!playbackState || playbackState.currently_playing_type !== 'track' || !playbackState.item || !playbackState.is_playing) {
            return null;
        }

        const track: SpotifyTrack = playbackState.item as SpotifyTrack;

        return {
            name: track.name,
            album: track.album.name,
            artists: track.artists.map((artist) => artist.name),
            uri: track.uri,
        };
    }

    public async skipSong(): Promise<void> {
        await this.api.player.skipToNext(
            await this.getActiveDeviceId()
        );
    }

    public async findSong(query: string): Promise<Track | null> {
        const results = await this.api.search(
            query,
            ['track'],
            null,
            1
        );

        if (results.tracks.items.length === 0) {
            return null;
        }

        const track = results.tracks.items[0];

        return {
            name: track.name,
            album: track.album.name,
            artists: track.artists.map((artist) => artist.name),
            uri: track.uri,
        };
    }

    public async addToQueue(song: string): Promise<Track | null> {
        // first, find the song
        const foundSong = await this.findSong(song);

        if (!foundSong) {
            return null;
        }

        // then add it to the queue
        await this.api.player.addItemToPlaybackQueue(
            foundSong.uri,
            await this.getActiveDeviceId()
        );

        return foundSong;
    }

    public async pauseSong(): Promise<void> {
        await this.api.player.pausePlayback(
            await this.getActiveDeviceId()
        );
    }

    public async resumeSong(): Promise<void> {
        await this.api.player.startResumePlayback(
            await this.getActiveDeviceId()
        );
    }

    private async refreshAccessToken(): Promise<AccessToken> {
        const url = "https://accounts.spotify.com/api/token";
        const payload = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
            client_id: this.clientId,
          }),
        }
      
        const body = await fetch(url, payload);
        const response = await body.json();

        // if the response is 400-499, then we need to re-authenticate
        if (response.error) {
            localStorage.removeItem('spotifyRefreshToken');
            onError(response.error_description);
        }

        return response;
    }

    private async getActiveDeviceId(): Promise<string> {
        const devices = await this
            .api
            .player
            .getAvailableDevices();
        
        const activeDevice = devices.devices.find((device) => device.is_active);

        if (!activeDevice) {
            throw new Error('No active device found');
        }

        return activeDevice.id;
    }
      
}

export default SpotifyClient;