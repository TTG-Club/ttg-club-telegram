import mongoose from 'mongoose';

export default class DataBase {
    static isSuccess = false;

    constructor() {
        this.init()
            .then(() => {
                DataBase.isSuccess = true;
            });
    }

    private init = () => new Promise<any>((resolve: (arg0: string) => void, reject: (arg0: any) => void) => {
        mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            user: process.env.DB_USER,
            pass: process.env.DB_PASS,
            dbName: process.env.DB_TABLE,
        }, (err: any) => {
            if (err) {
                console.error(err);

                reject(err)
            } else {
                resolve('connected')
            }
        })
    })
}
