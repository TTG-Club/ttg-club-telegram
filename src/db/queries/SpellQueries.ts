import DB from '../DB';
import { SpellModel } from '../models/Spell.model';
import IDB from '../../types/db';

export default class SpellQueries extends DB {
    // eslint-disable-next-line max-len
    public static getSpellList = (): Promise<IDB.ISpell[]> => new Promise<IDB.ISpell[]>((resolve, reject) => {
        SpellModel.find({}, (err: any, res: IDB.ISpell[]) => {
            if (err) {
                console.error(err);

                reject(err);
            } else {
                resolve(res);
            }
        }).sort({
            level: 1,
            name: 1
        })
    })

    // eslint-disable-next-line max-len
    public static getSpellListByName = (spellName: string): Promise<IDB.ISpell[]> => new Promise<IDB.ISpell[]>((resolve, reject) => {
        SpellModel.find({
            $or: [{
                name: new RegExp(spellName, 'gi')
            }, {
                aliases: new RegExp(spellName, 'gi')
            }]
        }, (err: any, res: IDB.ISpell[]) => {
            if (err) {
                console.error(err);

                reject(err);
            } else {
                resolve(res);
            }
        }).sort({
            level: 1,
            name: 1
        })
    })

    // eslint-disable-next-line max-len
    public static getSpellByID = (id: string): Promise<IDB.ISpell> => new Promise<IDB.ISpell>((resolve, reject) => {
        SpellModel.findOne({ _id: DB.toObjectID(id) }, (err: any, res: IDB.ISpell) => {
            if (err) {
                console.error(err);

                reject(err);
            } else {
                resolve(res);
            }
        }).sort({
            level: 1,
            name: 1
        })
    })
}
