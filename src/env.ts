import dotenv from "dotenv";
dotenv.config();

const env = {
  token: process.env.TOKEN!,
  voiceChannel: process.env.VOICE_CHANNEL!,
  specialUser: process.env.SPECIAL_USER!,
};

export default env;
