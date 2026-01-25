import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer an explicit env file path so running from repo root still loads `server/.env`.
const defaultEnvPath = path.resolve(__dirname, '../../.env');

dotenv.config({
    path: process.env.DOTENV_CONFIG_PATH || defaultEnvPath,
    override: true,
});
