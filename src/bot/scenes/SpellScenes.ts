import { Scenes } from 'telegraf';
import IBot from '../../types/bot';
import SpellQueries from '../../db/queries/SpellQueries';
import SpellActions from '../actions/SpellActions';

export default class SpellScenes {
    static findSpell(): Scenes.BaseScene<IBot.ISessionContext> {
        const scene = new Scenes.BaseScene<IBot.ISessionContext>('findSpell');

        scene.enter(async ctx => {
            await ctx.reply('Введи название заклинания (минимум 3 буквы)')
        });

        scene.command('back', async ctx => {
            await ctx.scene.leave();
        })

        scene.on('text', async ctx => {
            if (!ctx.message || !('text' in ctx.message)) {
                await ctx.reply('Произошла какая-то ошибка...');

                await ctx.scene.reenter();
            } else if (ctx.message.text.length < 3) {
                await ctx.reply('Название слишком короткое');

                await ctx.scene.reenter();
            } else {
                try {
                    const spellName = ctx.message.text;
                    const spellList = await SpellQueries.getSpellListByName(spellName);

                    if (spellList.length === 1) {
                        const msg = SpellActions.formatSpellMessage(spellList[0])

                        await ctx.replyWithHTML(msg);
                        await ctx.scene.leave();
                    } else if (spellList.length > 1 && spellList.length < 21) {
                        await ctx.reply(`Я нашел несколько заклинаний, где упоминается "${spellName}"`);
                        await ctx.reply(
                            'Выбери подходящее из этого списка',
                            SpellActions.getSpellListMarkup(spellList)
                        );
                        await ctx.scene.leave();
                    } else if (spellList.length > 20) {
                        // eslint-disable-next-line max-len
                        await ctx.reply(`Я нашел слишком много заклинаний, где упоминается "${spellName}"...`);
                        await ctx.scene.reenter();
                    } else {
                        await ctx.reply('Я не смог найти такое заклинание...');
                        await ctx.scene.reenter();
                    }
                } catch (err) {
                    console.error(err)

                    await ctx.reply('Что-то пошло не так... попробуй запустить команду еще раз');
                    await ctx.scene.leave();
                }
            }
        });

        scene.on('message', async ctx => {
            await ctx.reply('Это не похоже на название заклинания 🙃');

            await ctx.scene.reenter();
        })

        return scene;
    }
}
