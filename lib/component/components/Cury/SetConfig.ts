import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';
import type { RecursivePartial } from '../../../util.js';
import type { AllowedPrimitives } from '../../Component.js';
import type { CuryConfig } from '../Cury.js';

export type CurySetConfigParams = {
  config: RecursivePartial<Omit<CuryConfig, 'id'>, AllowedPrimitives>;
};

export type CuryConfigResponse = {
  restart_required: boolean;
};

/**
 * Update the component's configuration
 */
export default async function SetConfig(
  channel: RpcChannel,
  id: number,
  params: CurySetConfigParams,
): Promise<ResponseSuccessFrame<CuryConfigResponse>> {
  const requestFrame = createRequestFrame('Cury.SetConfig', { ...params, id });
  return channel.sendRequestFrame(requestFrame);
}
