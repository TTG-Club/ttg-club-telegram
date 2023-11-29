import { JSDOM } from 'jsdom';

export type TPairs = {
  name: string;
  value: string;
};

export const useJSDom = () => {
  const getArrayParagraphs = (html: string): string[] => {
    const fragment = JSDOM.fragment(html);
    const array = Array.from(fragment.childNodes);

    return array.map(node => {
      const dom = new JSDOM();
      const { window } = dom;
      const { document } = window;

      document.body.append(node);

      return document.body.innerHTML;
    });
  };

  const getHTMLArrayFromPairs = (array: TPairs[]): string =>
    array
      .map(pair => {
        const dom = new JSDOM();
        const { window } = dom;
        const { document } = window;

        const fragment = JSDOM.fragment(
          `<p><strong>${pair.name}.</strong> ${pair.value}</p>`
        );

        document.body.append(fragment);

        return document.body.innerHTML;
      })
      .join('');

  return {
    getArrayParagraphs,
    getHTMLArrayFromPairs
  };
};
