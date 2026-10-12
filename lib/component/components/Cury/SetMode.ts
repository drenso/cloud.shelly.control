import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';

export type CurySetModeParams = {
  mode: null | 'hall' | 'bedroom' | 'living_room' | 'lavatory_room' | 'reception' | 'workplace';
};

/**
 * Set the mode of operation.
 *
 * This will insert predefined schedules that control the heating and operation of the device that are suited for the appropriate room.
 *
 * Note that changing the mode from one to another will remove the schedules that were created by the previously active mode.
 */
export default async function SetMode(
  channel: RpcChannel,
  id: number,
  params: CurySetModeParams,
): Promise<ResponseSuccessFrame<null>> {
  const requestFrame = createRequestFrame('Cury.SetMode', { ...params, id });
  return channel.sendRequestFrame(requestFrame);
}
