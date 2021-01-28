import {
  Client,
  StreamDispatcher,
  VoiceChannel,
  VoiceConnection,
} from "discord.js";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import env from "./env";
import ytdl from "ytdl-core";

const airHornMp3 = fs.readFileSync(path.join(process.cwd(), "air-horn.mp3"));
const airHornStream = () => Readable.from(airHornMp3);
const despacitoStream = () =>
  ytdl("https://www.youtube.com/watch?v=gm3-m2CFVWM", { filter: "audioonly" });

async function main() {
  const client = new Client();
  client.on("ready", () => {
    console.log("Logged in as", client.user?.tag);
  });
  await client.login(env.token);

  const channel = (await client.channels.fetch(
    env.voiceChannel
  )) as VoiceChannel;
  let connection: VoiceConnection | null = null;
  let dispatcher: StreamDispatcher | null = null;
  let userConnected = false;
  let specialUserConnected = false;
  const connect = async () => {
    connection = await channel.join();
    connection.on("disconnect", () => {
      connection = null;
      dispatcher = null;
    });
  };
  const disconnect = () => {
    connection?.disconnect();
    connection = null;
    dispatcher = null;
  };
  const play = (track: "horn" | "despacito") => {
    if (userConnected && connection) {
      if (dispatcher) {
        // Kill any current tracks playing
        dispatcher.removeAllListeners();
        dispatcher.end();
      }
      let stream = track === "despacito" ? despacitoStream() : airHornStream();
      dispatcher = connection.play(stream).on("finish", () => play(track));
    }
  };
  client.on("voiceStateUpdate", async () => {
    const members = channel.members.filter(
      (x) => x.id !== channel.client.user?.id
    );
    const hasUser = members.size >= 1;
    const hasSpecialUser = members.has(env.specialUser);
    const userJoin = hasUser && !userConnected;
    const specialUserJoin = hasSpecialUser && !specialUserConnected;
    const userLeave = !hasUser && userConnected;
    const specialUserLeave = !hasSpecialUser && specialUserConnected;
    userConnected = hasUser;
    specialUserConnected = hasSpecialUser;

    if (userJoin) {
      await connect();
      if (specialUserJoin) {
        play("despacito");
      } else {
        play("horn");
      }
    } else if (specialUserJoin) {
      play("despacito");
    } else if (userLeave) {
      disconnect();
    } else if (specialUserLeave) {
      play("horn");
    }
  });
}
main();
