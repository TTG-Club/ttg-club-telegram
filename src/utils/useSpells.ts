import { useAxios } from './useAxios.js';
import { useConfig } from './useConfig.js';
import { useHelpers } from './useHelpers.js';
import { useMarkup } from './useMarkup.js';

import type {
  TSpellItem,
  TSpellItemComponents,
  TSpellLink
} from '../types/spell.js';

const { getUrl } = useHelpers();
const { MAX_LENGTH } = useConfig();
const { getDescriptionEmbeds } = useMarkup();

class Spells {
  private readonly http = useAxios();

  public loadSpells = async (
    search: string,
    limit = 10
  ): Promise<Array<TSpellLink>> => {
    try {
      const { data: spells } = await this.http.post<Array<TSpellLink>>({
        url: '/spells',
        payload: {
          page: 0,
          limit,
          search: {
            value: search.trim(),
            exact: false
          },
          order: [
            {
              field: 'level',
              direction: 'asc'
            },
            {
              field: 'name',
              direction: 'asc'
            }
          ]
        }
      });

      return spells;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  public loadSpell = async (spellLink: TSpellLink): Promise<TSpellItem> => {
    try {
      const { data: spell } = await this.http.post<TSpellItem>({
        url: spellLink.url
      });

      return spell;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  public getSpellResponse = (spell: TSpellItem): Promise<Array<string>> => {
    try {
      const messages: string[] = [
        `<b>${spell.name.rus}</b> [<i>${spell.name.eng}</i>]`
      ];

      const updateMsg = (str: string) => {
        const index = messages.length > 0 ? messages.length - 1 : 0;

        if (messages[index]!.length + str.length > MAX_LENGTH) {
          messages[index + 1] = str;

          return;
        }

        messages[index] += str;
      };

      updateMsg(`\n<i>${this.getSubTitle(spell)}</i>\n`);

      updateMsg(
        `\n<b>Источник:</b> ${spell.source.name} [${spell.source.shortName}]`
      );

      updateMsg(`\n<b>Время накладывания:</b> ${spell.time}`);
      updateMsg(`\n<b>Дистанция:</b> ${spell.range}`);
      updateMsg(`\n<b>Длительность:</b> ${spell.duration}`);

      updateMsg(
        `\n<b>Компоненты:</b> ${this.getComponents(spell.components)}\n`
      );

      const classes = spell.classes
        .map(
          classItem =>
            `<a href="${getUrl(classItem.url)}">${classItem.name}</a>`
        )
        .join(', ');

      if (classes.length) {
        updateMsg(`\n<b>Классы:</b> ${classes}`);
      }

      const subClasses = spell.subclasses
        ?.map(
          subclass =>
            `<a href="${getUrl(subclass.url)}">${subclass.name} (${
              subclass.class
            })</a>`
        )
        .join(', ');

      if (subClasses?.length) {
        updateMsg(`\n<b>Подклассы:</b> ${subClasses}`);
      }

      const races = spell.races
        ?.map(race => `<a href="${getUrl(race.url)}">${race.name}</a>`)
        .join(', ');

      if (races?.length) {
        updateMsg(`\n<b>Расы и происхождения:</b> ${races}`);
      }

      const backgrounds = spell.backgrounds
        ?.map(
          background =>
            `<a href="${getUrl(background.url)}">${background.name}</a>`
        )
        .join(', ');

      if (backgrounds?.length) {
        updateMsg(`\n<b>Предыстории:</b> ${backgrounds}`);
      }

      if (spell.description) {
        updateMsg(`\n\n`);

        for (const row of getDescriptionEmbeds(spell.description)) {
          updateMsg(row);
        }
      }

      if (spell.upper) {
        updateMsg(`\n\n<b>На более высоких уровнях: </b>`);

        for (const row of getDescriptionEmbeds(`<p>${spell.upper}</p>`)) {
          updateMsg(row);
        }
      }

      return Promise.resolve(messages);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  public getSubTitle = (spell: TSpellItem) =>
    `${spell.level ? `${spell.level} уровень` : 'заговор'}, ${spell.school}${
      spell.additionalType ? ` [${spell.additionalType}]` : ''
    }${spell.ritual ? ' (ритуал)' : ''}`;

  public getComponents = (components: TSpellItemComponents) =>
    `${
      components.v
        ? `Вербальный${components.s || components.m ? ', ' : ''}`
        : ''
    }${components.s ? `Соматический${components.m ? ', ' : ''}` : ''}${
      components.m ? `Материальный (${components.m})` : ''
    }`;
}

export const useSpells = () => new Spells();
