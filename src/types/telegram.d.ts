import type { ConversationFlavor } from '@grammyjs/conversations';
import type { HydrateFlavor } from '@grammyjs/hydrate';
import type { ParseModeFlavor } from '@grammyjs/parse-mode';
import type { Context } from 'grammy';

export interface IContext
  extends ParseModeFlavor<HydrateFlavor<Context & ConversationFlavor>> {}
