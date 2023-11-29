import type { IContext } from './telegram.js';
import type { MiddlewareFn } from 'grammy';

export interface ICallback {
  text: string;
  data: string;
  callback: MiddlewareFn<IContext>;
}
