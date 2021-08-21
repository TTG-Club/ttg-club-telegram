import mongoose from 'mongoose';
import BSON from 'bson';

export default class DB {
    public static connection: mongoose.Connection | undefined;

    public static connect = (): Promise<void> => new Promise<void>((resolve, reject) => {
        mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            user: process.env.DB_USER,
            pass: process.env.DB_PASS,
            dbName: process.env.DB_TABLE,
        })
            .then(res => {
                DB.connection = res.connection;

                resolve()
            })
            .catch(err => {
                console.error(err)

                reject(err)
            });
    });

    public static disconnect = async (): Promise<void> => {
        if (DB.connection) {
            await DB.connection.close();
        }
    }

    public static toObjectID(id: string): BSON.ObjectId {
        return new BSON.ObjectId(id);
    }
}
