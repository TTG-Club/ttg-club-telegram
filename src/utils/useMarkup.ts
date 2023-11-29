import sanitizeHtml from 'sanitize-html';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

import { useHelpers } from './useHelpers.js';
import { useJSDom } from './useJSDom.js';

const { getUrl } = useHelpers();

const allowedTags = [
  // Bold
  'b',
  'strong',

  // Italic
  'i',
  'em',

  // Strikethrough
  's',
  'del',

  // Underline
  'u',
  'ins',

  // Link
  'a',

  // Lists
  'ul',
  'li',
  'ol',

  // Paragraphs
  'p',

  // Table
  'table',
  'td',
  'th',
  'tr',

  // Dices
  'dice-roller'
];

export const useMarkup = () => {
  const turndownService = new TurndownService({
    bulletListMarker: '-'
  });

  turndownService.use(gfm);

  turndownService.addRule('paragraph', {
    filter: 'p',
    replacement: content => `\n\n${content}\n\n`
  });

  turndownService.addRule('diceRoller', {
    filter: node => node.nodeName === 'DICE-ROLLER',
    replacement: (content, node) => {
      let text = '';

      if ('getAttribute' in node && node.getAttribute('formula')) {
        text = `<b>${node.getAttribute('formula')}</b>`;
      }

      if ('getAttribute' in node && node.getAttribute(':formula')) {
        text = `<b>${node.getAttribute('formula')}</b>`;
      }

      if (content) {
        text = `<b>${content}</b>`;
      }

      return text;
    }
  });

  turndownService.addRule('inlineLink', {
    filter: (node, options) =>
      options.linkStyle === 'inlined' &&
      node.nodeName === 'A' &&
      !!node.getAttribute('href'),

    replacement: (content, node) => {
      const getUpdatedHref = (href: string) => {
        if (href.startsWith('http')) {
          return href;
        }

        return getUrl(href);
      };

      let href: string | null = null;

      if ('getAttribute' in node) {
        href = node.getAttribute('href');
      }

      if (href) {
        href = getUpdatedHref(href);
      }

      return `<a href="${href}">${content}</a>`;
    }
  });

  turndownService.addRule('baseTags', {
    filter: [
      // Bold
      'b',
      'strong',

      // Italic
      'i',
      'em',

      // Strikethrough
      's',
      'del',

      // Underline
      'u',
      'ins'
    ],
    replacement: (content, node) =>
      `<${node.nodeName.toLowerCase()}>${content}</${node.nodeName.toLowerCase()}>`
  });

  const getSanitized = (html: string) => sanitizeHtml(html, { allowedTags });

  const getMarkup = (html: string) => {
    if (!html) {
      return '';
    }

    const sanitized = getSanitized(html);

    return turndownService
      .turndown(sanitized)
      .replace(/\\\[/g, '[')
      .replace(/\\]/g, ']');
  };

  const getMarkupParagraphs = (html: string) => {
    const { getArrayParagraphs } = useJSDom();

    const array = getArrayParagraphs(
      sanitizeHtml(html, { allowedTags: [...allowedTags, 'p'] })
    );

    return array.map(node => getMarkup(node));
  };

  const getDescriptionEmbeds = (html: string) => {
    const rows = getMarkupParagraphs(html).filter(row => !!row);

    const embeds: string[] = [];

    let str = '';

    for (const row of rows) {
      if (str.length + row.length > 2048) {
        embeds.push(str.trim());
        str = '';
      }

      str += `\n\n${row}`;
    }

    str = str.trim();

    if (embeds[embeds.length - 1] !== str) {
      embeds.push(str.trim());
    }

    return embeds.filter(row => !!row);
  };

  return {
    getSanitized,
    getMarkup,
    getMarkupParagraphs,
    getDescriptionEmbeds
  };
};
