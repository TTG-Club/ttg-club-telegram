import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { error, parsed } = dotenv.config({
  path: resolve(__dirname, '../../.env')
});

if (error !== undefined || parsed === undefined) {
  throw error;
}

export const useConfig = (): {
  TOKEN: string;
  API_URL: string;
  MAX_LENGTH: number;
} => {
  if (!parsed.TOKEN) {
    throw new Error('TOKEN is not defined');
  }

  if (!parsed.API_URL) {
    throw new Error('API_URL is not defined');
  }

  return {
    TOKEN: parsed.TOKEN,
    API_URL: parsed.API_URL,
    MAX_LENGTH: 4096
  };
};
