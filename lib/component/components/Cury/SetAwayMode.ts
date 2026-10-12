import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';

export type CurySetAwayModeParams = {
  on: boolean;
};

/**
 * Set away mode.
 *
 * Turning it on will turn off heating for both vials, turn off ambient light,
 * turn off autoswitching and disable all schedules and vice versa if it's off.
 *
 * When away mode is active, all RPC methods which can modify the device state (except this one) will return an error
 * indicating that away mode is active.
 */
export default async function SetAwayMode(
  channel: RpcChannel,
  id: number,
  params: CurySetAwayModeParams,
): Promise<ResponseSuccessFrame<null>> {
  const requestFrame = createRequestFrame('Cury.SetAwayMode', { ...params, id });
  return channel.sendRequestFrame(requestFrame);
}
