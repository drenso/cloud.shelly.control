import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';
import type { CuryStatus } from '../Cury.js';

/**
 * Obtain the component's status
 */
export default async function GetStatus(channel: RpcChannel, id: number): Promise<ResponseSuccessFrame<CuryStatus>> {
  const requestFrame = createRequestFrame('Cury.GetStatus', { id });
  return channel.sendRequestFrame(requestFrame);
}
