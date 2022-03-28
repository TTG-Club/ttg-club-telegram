import * as dotenv from 'dotenv';

dotenv.config({
    path: __dirname + '/../.env'
});

export default {
    baseURL: process.env.BASE_URL,
    tgToken: process.env.TG_TOKEN
}
