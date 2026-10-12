import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';

export type CuryBoostParams = {
  slot: 'left' | 'right';
};

export type CuryBoostResponse = {
  boost: {
    started_at: number;
    duration: number;
  };
};

/**
 * Turn on boost mode (max intensity for a predefined period) for a vial in a slot
 */
export default async function Boost(
  channel: RpcChannel,
  id: number,
  params: CuryBoostParams,
): Promise<ResponseSuccessFrame<CuryBoostResponse>> {
  const requestFrame = createRequestFrame('Cury.Boost', { ...params, id });
  return channel.sendRequestFrame(requestFrame);
}
