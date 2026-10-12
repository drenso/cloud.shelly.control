import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';

export type CuryStopBoostParams = {
  slot: 'left' | 'right';
};

export type CuryStopBoostResponse = {
  was_on: boolean;
};

/**
 * Stop boost mode (max intensity for a predefined period) for a vial in a slot
 */
export default async function StopBoost(
  channel: RpcChannel,
  id: number,
  params: CuryStopBoostParams,
): Promise<ResponseSuccessFrame<CuryStopBoostResponse>> {
  const requestFrame = createRequestFrame('Cury.StopBoost', { ...params, id });
  return channel.sendRequestFrame(requestFrame);
}
