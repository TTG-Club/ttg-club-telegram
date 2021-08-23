import BSON from 'bson';
import DB from '../DB';
import { MetricsModel } from '../models/Metrics.model';

export default class MetricsQueries extends DB {
    public static checkAndUpdateTodayMetrics = async (user: number, spellCount: number): Promise<void> => {
        try {
            const today = await MetricsModel.findOne({ date: new Date().toDateString() });

            if (today) {
                const count = spellCount + today.spellCount;
                const users = today.users.includes(user)
                    ? today.users
                    : [
                        ...today.users,
                        user
                    ];

                await MetricsQueries.updateTodayMetrics(users, count);
            } else {
                await MetricsQueries.createTodayMetrics(user, spellCount);
            }
        } catch (err) {
            console.error(err);
        }
    }

    public static updateTodayMetrics = async (users: number[], spellCount: number): Promise<void> => {
        try {
            await MetricsModel.findOneAndUpdate({
                date: new Date().toDateString()
            }, {
                users,
                spellCount
            })
        } catch (err) {
            console.error(err);
        }
    }

    // eslint-disable-next-line max-len
    public static createTodayMetrics = async (user: number, spellCount: number): Promise<void> => {
        try {
            const doc = new MetricsModel({
                _id: new BSON.ObjectId(),
                date: new Date().toDateString(),
                spellCount,
                users: [user]
            });

            await doc.save();
        } catch (err) {
            console.error(err)
        }
    }
}
