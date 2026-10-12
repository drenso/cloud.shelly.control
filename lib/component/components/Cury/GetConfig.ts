import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';
import type { CuryConfig } from '../Cury.js';

/**
 * Obtain the component's configuration
 */
export default async function GetConfig(channel: RpcChannel, id: number): Promise<ResponseSuccessFrame<CuryConfig>> {
  const requestFrame = createRequestFrame('Cury.GetConfig', { id });
  return channel.sendRequestFrame(requestFrame);
}
