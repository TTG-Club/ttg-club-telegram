import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import { SpellModel } from '../db/models/Spell.model';
import IDB from '../types/db';
import ISpell = IDB.ISpell;
import DB from '../db';
import SpellQueries from '../db/queries/SpellQueries';

export default class Server {
    private app = express.application;

    constructor() {
        DB.connect()
            .then(async () => {
                try {
                    await this.init();
                    this.setupRoutes();
                } catch (err) {
                    console.error(err)
                }
            })
            .catch(err => {
                throw err
            });
    }

    private init() {
        return new Promise(resolve => {
            this.app = express();

            this.app.use(cors({ origin: true }));
            this.app.use(bodyParser.json());
            this.app.use(express.static(`${__dirname}${process.env.WEB_DIR}`))

            this.app.listen(Number(process.env.PORT), String(process.env.HOST), () => {
                resolve(`Server started on port ${process.env.PORT}`)
            })
        })
    }

    private setupRoutes(): void {
        this.app.get('/spells', (req, res) => {
            SpellQueries.getSpellList()
                .then((response: ISpell[]) => {
                    res.json({
                        spells: response
                    });
                })
                .catch(err => {
                    res.status(500).send(err);
                })
        });

        this.app.post('/update-spell', (req, res) => {
            if (!('spell' in req.body)) {
                res.status(500).send('Can\'t find "spell" key in body');

                return;
            }

            this.updateSpell(req.body.spell)
                .then(response => {
                    if (response) {
                        res.json(response)
                    } else {
                        res.status(500).send('Can\'t find this spell')
                    }
                })
        });
    }

    private updateSpell = (spell: ISpell) => new Promise((resolve, reject) => {
        // eslint-disable-next-line no-underscore-dangle
        SpellModel.findByIdAndUpdate(DB.toObjectID(spell._id), spell, {
            useFindAndModify: false,
            returnOriginal: false
        }, (err, doc) => {
            if (err) {
                reject(err)
            } else {
                resolve(doc)
            }
        })
    })
}
