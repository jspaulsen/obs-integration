import comfyjs from "comfy.js";


enum ResponseType {
    Say,
    Whisper,
}

interface CommandResponse {
    type: ResponseType;
    message?: string;
}

interface Flags {
    broadcaster: boolean;
    mod: boolean;
    subscriber: boolean;
    vip: boolean;
    founder: boolean;
}

type RewardHandler = (user: string, rewardId: string, message: string, extra: any) => Promise<CommandResponse | void>;
type CommandHandler = (user: string, command: string, message: string, flags: Flags, extra: any) => Promise<CommandResponse | void>;


class EventHandler {
    private token: string;
    private channel: string;
    private rewardHandlers: Map<string, RewardHandler> = new Map();
    private commandHandlers: Map<string, CommandHandler> = new Map();

    constructor(token: string, channel: string) {
        this.token = token;
        this.channel = channel;

        comfyjs.Init(this.channel, this.token);
        comfyjs.onReward = this.onRewardEventHandler.bind(this);
        comfyjs.onCommand = this.onCommandEventHandler.bind(this);
    }

    private async onCommandEventHandler(user: string, command: string, message: string, flags: any, extra: any) {
        const handler = this.commandHandlers.get(command);
        const channel = extra.channel;

        console.log(extra);
        console.log(flags);

        if (!handler) {
            console.log(`Unhandled command: ${command}`);
            return;
        }

        const response = await handler(user, command, message, flags, extra);

        if (!response) {
            return;
        }

        switch (response.type) {
            case ResponseType.Say:
                comfyjs.Say(response.message, channel);
                break;
            case ResponseType.Whisper:
                comfyjs.Whisper(user, response.message);
                break;
            default:
                throw new Error(`Unknown response type: ${response.type}`);
        }
    }

    private async onRewardEventHandler(user: string, reward: any, cost: any, message: any, extra: any) {
        const rewardId = extra.reward.id;
        const handler = this.rewardHandlers.get(rewardId);
        const channel = extra.channel;

        if (!handler) {
            console.log(`Unhandled reward: ${rewardId}`);
            return;
        }

        const response = await handler(user, rewardId, message, extra);

        if (!response) {
            return;
        }

        switch (response.type) {
            case ResponseType.Say:
                comfyjs.Say(response.message, channel);
                break;
            case ResponseType.Whisper:
                comfyjs.Whisper(user, response.message);
                break;
            default:
                throw new Error(`Unknown response type: ${response.type}`);
        }
    }

    public registerRewardHandler(rewardId: string, handler: RewardHandler) {
        this.rewardHandlers.set(rewardId, handler);
    }

    public registerRewardsHandler(rewardIds: string[], handler: RewardHandler) {
        for (const rewardId of rewardIds) {
            this.registerRewardHandler(rewardId, handler);
        }
    }

    public registerCommandHandler(command: string, handler: CommandHandler) {
        if (command.startsWith('!')) {
            command = command.slice(1);
        }

        this.commandHandlers.set(command, handler);
    }

    public registerCommandsHandler(commands: string[], handler: CommandHandler) {
        for (const command of commands) {
            this.registerCommandHandler(command, handler);
        }
    }
}

export {
    EventHandler,
    RewardHandler,
    CommandHandler,
    Flags,
    CommandResponse,
    ResponseType,
}