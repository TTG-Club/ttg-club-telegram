import { useHelpers } from '../../utils/useHelpers.js';

import type { ICommand } from '../../types/commands.js';

const { leaveScene } = useHelpers();

const cancelCommand: ICommand = {
  hidden: true,
  order: 0,
  command: 'cancel',
  description: 'Выход из режима',
  callback: leaveScene
};

export default cancelCommand;
