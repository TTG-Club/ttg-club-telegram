import DataBase from '../db';

export default class DBHelper {
    static isConnected(): boolean {
        return DataBase.isSuccess
    }
}
