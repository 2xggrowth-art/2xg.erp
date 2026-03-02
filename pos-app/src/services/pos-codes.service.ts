import { ipc } from './ipc-client';

export interface PosCode {
  id: string;
  code: string;
  employee_name: string;
  is_active: boolean;
}

export const posCodesService = {
  async getAllPosCodes(): Promise<{ data: PosCode[] }> {
    const result = await ipc().getAllPosCodes();
    return { data: result.success ? result.data : [] };
  },

  async verifyCode(code: string): Promise<{ data: PosCode | null }> {
    const result = await ipc().verifyPosCode(code);
    return { data: result.success ? result.data : null };
  },
};
