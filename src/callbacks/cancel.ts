import { useHelpers } from '../utils/useHelpers.js';

import type { ICallback } from '../types/callbacks.js';

const { leaveScene } = useHelpers();

const cancelCallback: ICallback = {
  text: 'Выход из режима',
  data: 'cancel',
  callback: leaveScene
};

export default cancelCallback;
