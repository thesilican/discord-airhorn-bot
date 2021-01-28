import dotenv from "dotenv";
dotenv.config();

const env = {
  owner: process.env.OWNER!,
  guild: process.env.GUILD!,
  token: process.env.TOKEN!,
  voiceChannel: process.env.VOICE_CHANNEL!,
  adminRole: process.env.ADMIN_ROLE!,
};

export default env;
