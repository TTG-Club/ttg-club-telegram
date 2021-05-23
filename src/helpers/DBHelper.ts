import BSON from 'bson';
import DataBase from '../db';

export default class DBHelper {
    static isConnected(): boolean {
        return DataBase.isSuccess
    }

    static toObjectId(id: string): BSON.ObjectId {
        return new BSON.ObjectId(id);
    }
}
