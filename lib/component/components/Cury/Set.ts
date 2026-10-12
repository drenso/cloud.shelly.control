import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';

export type CurySetParams = {
  slot: 'left' | 'right';
  /** Vaporization intensity in percents (0 - off, 1..100 working) */
  intensity?: number;
  /** Turns vaporization on or off without modifying the intensity value */
  on?: boolean;
};

/**
 * Set the vaporizing intensity of a vial in a slot
 */
export default async function Set(
  channel: RpcChannel,
  id: number,
  params: CurySetParams,
): Promise<ResponseSuccessFrame<null>> {
  const requestFrame = createRequestFrame('Cury.Set', { ...params, id });
  return channel.sendRequestFrame(requestFrame);
}
