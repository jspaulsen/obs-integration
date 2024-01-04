import { EventHandler } from "./event_handler";
// import * as blacklist from "../assets/blacklist.txt";


interface TTSMapping {
  [id: string]: string;
}

const NAMES = [
  "Filiz", "Astrid", "Tatyana", "Maxim", "Carmen", "Ines", "Cristiano", "Vitoria",
  "Ricardo", "Maja", "Jan", "Jacek", "Ewa", "Ruben", "Lotte", "Liv", "Seoyeon",
  "Takumi", "Mizuki", "Giorgio", "Carla", "Bianca", "Karl", "Dora", "Mathieu",
  "Celine", "Chantal", "Penelope", "Miguel", "Mia", "Enrique", "Conchita", "Geraint",
  "Salli", "Matthew", "Kimberly", "Kendra", "Justin", "Joey", "Joanna", "Ivy",
  "Raveena", "Aditi", "Emma", "Brian", "Amy", "Russell", "Nicole", "Vicki",
  "Marlene", "Hans", "Naja", "Mads", "Gwyneth", "Zhiyu", "Tracy", "Danny",
  "Huihui", "Yaoyao", "Kangkang", "HanHan", "Zhiwei", "Asaf", "An", "Stefanos",
  "Filip", "Ivan", "Heidi", "Herena", "Kalpana", "Hemant", "Matej", "Andika",
  "Rizwan", "Lado", "Valluvar", "Linda", "Heather", "Sean", "Michael", "Karsten",
  "Guillaume", "Pattara", "Jakub", "Szabolcs", "Hoda", "Naayf"
];

async function getTTS(speaker: string, message: string): Promise<string> {
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${speaker}&text=${encodeURIComponent(message.trim())}`;
  const response = await fetch(url);

  if (response.status !== 200) {
    throw new Error(await response.text());
  }

  return URL.createObjectURL(
    await response.blob()
  )
}


class TTSHandler {
  public skipTTSId: string = "7481775e-5c63-43b9-83c7-d65061922f68";
  public randomTTSId: string = "0fa537dd-c9fe-4f84-ab8d-0be967dc3c16";
  private ttsMapping: TTSMapping = {
    "2da16ec5-b966-4ce0-a40d-6d0ba2f94a6e": "Brian",
    "ca333739-872c-4fbe-8866-b8c291a2fe87": "Kendra",
    "0fcde0bf-f827-4506-b845-986fe1259418": "Geraint",
    "ca6afa06-77d2-440f-b8b6-5a7729c26fe8": "Kimberly",
    "01dee543-d5b1-488a-87b1-ff1c5be5ec3e": "Russell",
  };

  private audio: HTMLAudioElement;
  private ttsQueue: string[] = [];
  private currentTTS: string | null = null;

  constructor() {
    this.audio = document.getElementById("audio") as HTMLAudioElement;

    /* This should really only happen if we're debugging locally */
    if (!this.audio) {
      this.audio = new Audio();
    }
    
    this.audio.onended = this.onAudioEnded.bind(this);
  }

  public getSpeakerIds(): string[] {
    return Object.keys(this.ttsMapping);
  }

  private async onAudioEnded() {
    const next = this.ttsQueue.shift();

    console.log(`Audio ended, next: ${next}`)
    this.currentTTS = null;

    if (!next) {
      return;
    }

    await this.playTTS(next);
  }

  public async handleReward(user: string, rewardId: string, message: string, extra: any) {
    const speaker = this.ttsMapping[rewardId];

    if (!speaker) {
      console.log(`Unhandled speaker: ${rewardId}`);
      return;
    }

    const ttsUrl = await getTTS(speaker, message);

    if (this.currentTTS) {
      this.ttsQueue.push(ttsUrl);
      return;
    }

    await this.playTTS(ttsUrl);
  }

  public async handleRandomTTS(user: string, rewardId: string, message: string, extra: any) {
    const speaker = NAMES[Math.floor(Math.random() * NAMES.length)];
    const ttsUrl = await getTTS(speaker, message);

    if (this.currentTTS) {
      this.ttsQueue.push(ttsUrl);
      return;
    }

    await this.playTTS(ttsUrl);
  }

  public async handleSkipTTS(user: string, message: string, extra: any) {
    if (this.currentTTS) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = "";

      this.onAudioEnded();
    }
  }

  private async playTTS(ttsUrl: string) {
    this.currentTTS = ttsUrl;
    this.audio.src = ttsUrl;

    await this.audio.play();
  }
}

export {
  TTSHandler,
}