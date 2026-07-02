import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const isProd = process.env.NODE_ENV === "production";
const envFile = path.join(root, isProd ? ".env" : ".env.development");

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else if (!isProd && fs.existsSync(path.join(root, ".env"))) {
  dotenv.config({ path: path.join(root, ".env") });
} else {
  dotenv.config();
}

export default envFile;
