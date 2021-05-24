import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { Spell } from '../db/models/spells';
import DB from '../types/db';
import DBHelper from '../helpers/DBHelper';

export default class Server {
    private app = express.application;

    constructor() {
        this.init()
            .then(() => {
                this.setupRoutes();
            });
    }

    private init() {
        return new Promise(resolve => {
            this.app = express();

            this.app.use(cors());
            this.app.use(bodyParser.json());
            this.app.use(express.static(`${__dirname}${process.env.WEB_DIR}`))

            this.app.listen(Number(process.env.PORT), String(process.env.HOST), () => {
                resolve(`Server started on port ${process.env.PORT}`)
            })
        })
    }

    private setupRoutes(): void {
        this.app.get('/spells', (req, res) => {
            this.getAllSpells()
                .then(response => {
                    if (typeof response !== 'string') {
                        res.json({
                            spells: response
                        })
                    }
                })
        });

        this.app.post('/update-spell', (req, res) => {
            if (!('spell' in req.body)) {
                res.status(500).send('Can\'t find "spell" key in body');

                return;
            }

            this.updateSpell(req.body.spell)
                .then(response => {
                    console.log(response)
                })
        });
    }

    private getAllSpells = () => new Promise<string | DB.ISpell[]>((resolve, reject) => {
        Spell.find({}, (err: any, res: DB.ISpell[]) => {
            if (err) {
                console.error(err);

                // eslint-disable-next-line prefer-promise-reject-errors
                reject('Произошла какая-то ошибка...');
            } else if (res) {
                resolve(res);
            } else {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject('Я не смог найти такое заклинание 😭')
            }
        })
    })

    private updateSpell = (spell: DB.ISpell) => new Promise((resolve, reject) => {
        // eslint-disable-next-line no-underscore-dangle
        Spell.findByIdAndUpdate(DBHelper.toObjectId(spell._id), spell, {}, (err, doc, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })
    })
}
