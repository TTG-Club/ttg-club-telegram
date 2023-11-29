import { useConfig } from '../utils/useConfig.js';

const { API_URL } = useConfig();

export const ABOUT_MESSAGE =
  'Этот бот служит дополнением для онлайн-справочника TTG Club, ' +
  `доступного по этой ссылке: ${API_URL}` +
  '\n\nМы ждем тебя в наших социальных сетях, присоединиться можно по кнопкам ниже ☺️';

export const SOCIAL_LINKS = {
  site: {
    label: 'Сайт TTG Club',
    url: API_URL
  },
  discord: {
    label: 'Discord-канал',
    url: 'https://discord.gg/6yqaM7hcyZ'
  },
  vk: {
    label: 'Сообщество VK',
    url: 'https://vk.com/ttg.club'
  }
};
