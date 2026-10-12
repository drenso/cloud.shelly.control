import type { RpcChannel } from '../../../rpc/channel/RpcChannel.js';
import { createRequestFrame, type ResponseSuccessFrame } from '../../../rpc/Rpc.js';

export type CuryGetVialInfoParams<Slot extends 'left' | 'right' | undefined> = {
  /** Name of the slot in which the vial is placed */
  slot?: Slot;
};

export type CuryGetVialInfoResponse<Slot extends 'left' | 'right' | undefined> = Slot extends undefined
  ? CuryVialCompleteInfo
  : CuryVialSlotInfo;

type CuryVialCompleteInfo = {
  id: number;
  left?: CuryVialSlotInfo;
  right?: CuryVialSlotInfo;
};

type CuryVialSlotInfo = {
  type: string;
  product_name: string;
  mfr_name: string;
  exp_date: string;
  default_intensity: number;
  serial: string;
  color_intensity: {
    brightness: number;
    rgb: [number, number, number];
  };
  color_level: {
    brightness: number;
    rgb: [number, number, number];
  };
};

/**
 * Obtain the detailed info of a vial in a slot
 */
export default async function GetVialInfo<Slot extends 'left' | 'right' | undefined>(
  channel: RpcChannel,
  id: number,
  params?: CuryGetVialInfoParams<Slot>,
): Promise<ResponseSuccessFrame<CuryGetVialInfoResponse<Slot> | null>> {
  const requestFrame = createRequestFrame('Cury.GetVialInfo', { ...params, id });
  return channel.sendRequestFrame(requestFrame);
}
