import DataBase from './db';
import Bot from './bot';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

// eslint-disable-next-line no-new
new DataBase();
// eslint-disable-next-line no-new
new Bot();
