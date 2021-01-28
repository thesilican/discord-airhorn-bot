import {
  Command,
  CommandClient,
  Interaction,
} from "@thesilican/slash-commando";
import Discord from "discord.js";
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

  play() {
    if (!this.connection || !this.shouldPlay) {
      this.dispatcher = null;
      return;
    }
    this.dispatcher = this.connection.play(airHornStream());
    this.dispatcher.on("finish", this.play.bind(this));
  }

  onUserJoinOrLeave() {
    const members = this.channel.members.size;
    this.shouldPlay = members >= 2;
    this.play();
  }
}

class AirHornCommand extends Command {
  player: AirHornPlayer;
  constructor(player: AirHornPlayer) {
    super({
      name: "join-air-horn",
      description: "Join an air horn room",
    });
    this.player = player;
  }

  async run(int: Interaction) {
    if (!int.member.roles.cache.has(env.adminRole)) {
      int.say("You do not have permission to use this command");
      return;
    }

    this.player.connect();
  }
}

async function main() {
  const client = new CommandClient({
    owner: env.owner,
    guild: env.guild,
    token: env.token,
  });

  await client.start({ noReconcileCommands: true });

  const voiceChannel = (await client.channels.fetch(
    env.voiceChannel
  )) as Discord.VoiceChannel;

  const player = new AirHornPlayer(voiceChannel);
  client.registry.registerCommands([new AirHornCommand(player)]);
  client.reconcileCommands();
  client.on("voiceStateUpdate", player.onUserJoinOrLeave.bind(player));
}
main();
