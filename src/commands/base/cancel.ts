import { useHelpers } from '../../utils/useHelpers.js';

import type { ICommand } from '../../types/commands.js';

const { leaveScene } = useHelpers();

const cancelCommand: ICommand = {
  visible: false,
  order: 0,
  command: 'cancel',
  description: 'Выход из режима',
  callback: leaveScene
};

export default cancelCommand;
