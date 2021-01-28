import Discord, { Client, VoiceChannel } from "discord.js";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import env from "./env";

const airHornMp3 = fs.readFileSync(path.join(process.cwd(), "air-horn.mp3"));
const airHornStream = () => Readable.from(airHornMp3);

class AirHornPlayer {
  channel: Discord.VoiceChannel;
  connection: Discord.VoiceConnection | null;
  dispatcher: Discord.StreamDispatcher | null;
  shouldPlay: boolean;

  constructor(channel: Discord.VoiceChannel) {
    this.channel = channel;
    this.connection = null;
    this.shouldPlay = false;
    this.dispatcher = null;
  }

  async connect() {
    if (this.connection) {
      this.disconnect();
    }

    let connection: Discord.VoiceConnection;
    try {
      connection = await this.channel.join();
    } catch (err) {
      console.error("Error connecting to voice channel:", err);
      return;
    }
    connection.on("disconnect", this.onDisconnect.bind(this));
    this.connection = connection;
    this.play();
  }

  disconnect() {
    if (!this.connection) return;
    this.connection.removeAllListeners();
    this.connection.disconnect();
    this.connection = null;
  }

  onDisconnect() {
    this.connection = null;
  }

  async play() {
    if (!this.shouldPlay) {
      this.disconnect();
      this.dispatcher = null;
      return;
    }
    if (!this.connection) {
      await this.connect();
    }
    this.dispatcher = this.connection!.play(airHornStream());
    this.dispatcher.on("finish", this.play.bind(this));
  }

  onUserJoinOrLeave() {
    console.log("Event");
    const members = Array.from(this.channel.members.keys()).filter(
      (x) => x !== this.channel.client.user?.id
    ).length;
    this.shouldPlay = members >= 1;
    this.play();
  }
}

async function main() {
  const client = new Client();
  client.on("ready", () => {
    console.log("Logged in as", client.user?.tag);
  });
  await client.login(env.token);

  const voiceChannel = (await client.channels.fetch(
    env.voiceChannel
  )) as VoiceChannel;
  const player = new AirHornPlayer(voiceChannel);
  client.on("voiceStateUpdate", player.onUserJoinOrLeave.bind(player));
}
main();
