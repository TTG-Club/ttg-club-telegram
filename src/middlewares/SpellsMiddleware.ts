import { stripHtml } from 'string-strip-html';
import NSpell from '../../typings/Spell';
import {
    CLASSES, CLASSES_FROM, DAMAGE_INFLICTS, SCHOOLS, SOURCES, TIMES
} from '../locales/spell';
import config from '../.config';

export default class SpellsMiddleware {
    getSpellMessage = (spell: NSpell.ISpell): {
        messages: string[],
        url: string
    } => {
        const messages: string[] = [ `<b>${ spell.name }</b> [<i>${ spell.englishName }</i>]` ];
        const updateMsg = (str: string) => {
            const index = messages.length > 0 ? messages.length - 1 : 0;

            if (messages[index].length + str.length > 4000) {
                messages[index + 1] = str;

                return;
            }

            messages[index] += str;
        }

        updateMsg(`\n<i>${ this.getLevel(spell.level) }, ${ this.getSchool(spell.school) }${ spell?.meta?.ritual
            ? ' (ритуал)'
            : '' }</i>\n`);
        updateMsg(`\n<b>Источник:</b> ${ this.getSource(spell.source) } [${ spell.source }]`);

        if (spell?.damageInflict) {
            updateMsg(`\n<b>Тип урона:</b> ${ this.getDamageInflicts(spell.damageInflict) }`);
        }

        updateMsg(`\n<b>Время накладывания:</b> ${ this.getTimes(spell.time) }`);
        updateMsg(`\n<b>Дистанция:</b> ${ this.getRange(spell.range) }`);
        updateMsg(`\n<b>Длительность:</b> ${ this.getDuration(spell.duration) }`);
        updateMsg(`\n<b>Компоненты:</b> ${ this.getComponents(spell.components) }`);
        updateMsg(this.getClasses(spell.classes));

        this.getEntries(spell.entries).forEach(str => {
            updateMsg(`\n\n${ str }`)
        });

        if (spell?.entriesHigherLevel) {
            this.getEntries(spell.entriesHigherLevel.entries).forEach((str, index) => {
                updateMsg(`\n\n${ !index ? '<b>На больших уровнях: </b>' : '' }${ str }`)
            });
        }

        return {
            url: this.getOriginal(spell.englishName),
            messages
        };
    }

    private getDamageInflicts = (list: string[]): string => list.map((item: string) => (
        item in DAMAGE_INFLICTS
            ? DAMAGE_INFLICTS[item as keyof typeof DAMAGE_INFLICTS]
            : item)).join('; ');

    private getSchool = (name: string): string => (name in SCHOOLS
        ? SCHOOLS[name as keyof typeof SCHOOLS]
        : name);

    private getLevel = (level: number): string => (level ? `${ level } уровень` : 'Заговор');

    private getClass = (name: string): string => (name in CLASSES
        ? CLASSES[name as keyof typeof CLASSES]
        : name);

    private getSource = (source: string): string => (source in SOURCES
        ? SOURCES[source as keyof typeof SOURCES]
        : source)

    private getClasses = (classes: NSpell.IClass): string => {
        let res = '';

        Object.entries(classes).forEach(([ from, list ]) => {
            if (!Array.isArray(list) || !list.length) {
                return;
            }

            const fromStr = from in CLASSES_FROM
                ? CLASSES_FROM[from as keyof typeof CLASSES_FROM]
                : from;
            const str = list.map((classObj: NSpell.IClassItem) => {
                const { name, source } = classObj;
                const nameStr = this.getClass(name);

                return `${ nameStr } [${ source }]`;
            }).join('; ');

            res += `\n<b>${ fromStr }:</b> ${ str }`;
        });

        return res
    };

    private getTime = (time: NSpell.ITime): string => {
        const unit = time.unit in TIMES
            ? TIMES[time.unit as keyof typeof TIMES](time.number)
            : time.unit;

        return time?.condition
            ? `${ time.number } ${ unit }, ${ time.condition.trim() }`
            : `${ time.number } ${ unit }`
    }

    private getTimes = (times: NSpell.ITime[]): string => times.map(time => this.getTime(time)).join('; ')

    private getComponents = (components: NSpell.IComponents): string => {
        const { v, s, m } = components;
        const res = [];

        if (v) {
            res.push('вербальный');
        }

        if (s) {
            res.push('соматический');
        }

        if (m) {
            res.push(`материальный (${ m })`)
        }

        return res.join(', ');
    }

    private getRange = (range: NSpell.IRange): string => range.raw.toLowerCase()

    private getDuration = (durationList: NSpell.IDuration[]): string => durationList
        .map(duration => duration.raw.toLowerCase())
        .join('; ')

    private getEntries = (entries: string[]): string[] => {
        const tags = [ 'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'a', 'code', 'pre' ];
        return entries.map((str: string) => stripHtml(str, { ignoreTags: tags })
            .result
            .replaceAll('href="/', `href="${ config.baseURL }/`));
    }

    private getOriginal = (engName: string) => `${ config.baseURL }/spells/${ engName.replaceAll(' ', '_') }`
}
