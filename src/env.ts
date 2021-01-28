import dotenv from "dotenv";
dotenv.config();

const env = {
  token: process.env.TOKEN!,
  voiceChannel: process.env.VOICE_CHANNEL!,
};

export default env;
