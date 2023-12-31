import type { FilterHandler, ActionHandler, InitHandler, ScheduleHandler, EmbedHandler } from '@directus/types';

// TODO: remove, once exported from '@directus/extensions'
//   @see  https://github.com/directus/directus/issues/20925
export type RegisterFunctions = {
  filter: <T = unknown>(event: string, handler: FilterHandler<T>) => void;
  action: (event: string, handler: ActionHandler) => void;
  init: (event: string, handler: InitHandler) => void;
  schedule: (cron: string, handler: ScheduleHandler) => void;
  embed: (position: 'head' | 'body', code: string | EmbedHandler) => void;
};