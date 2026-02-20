import { AssemblyStatus, BinZone } from '../types/assembly';

export const ASSEMBLY_STATUS_LABELS: Record<AssemblyStatus, string> = {
  inwarded: 'Inwarded',
  assigned: 'Assigned for Assembly',
  in_progress: 'Assembly in Progress',
  ready_for_sale: 'Ready for Sale (100%)',
};

export const BIN_ZONE_LABELS: Record<BinZone, string> = {
  inward_zone: 'Inward Zone',
  assembly_zone: 'Assembly Zone',
  ready_zone: 'Ready for Sale Zone',
};

export const STATUS_TO_ZONE_MAP: Record<AssemblyStatus, BinZone> = {
  inwarded: 'inward_zone',
  assigned: 'assembly_zone',
  in_progress: 'assembly_zone',
  ready_for_sale: 'ready_zone',
};

export const STATUS_COLORS: Record<AssemblyStatus, string> = {
  inwarded: '#6366f1',
  assigned: '#f59e0b',
  in_progress: '#3b82f6',
  ready_for_sale: '#10b981',
};

export const ZONE_COLORS: Record<BinZone, string> = {
  inward_zone: '#6366f1',
  assembly_zone: '#3b82f6',
  ready_zone: '#10b981',
};

export const STATUS_ORDER: AssemblyStatus[] = [
  'inwarded',
  'assigned',
  'in_progress',
  'ready_for_sale',
];

export const getStatusLabel = (status: string): string =>
  ASSEMBLY_STATUS_LABELS[status as AssemblyStatus] || status;

export const getZoneLabel = (zone: string): string =>
  BIN_ZONE_LABELS[zone as BinZone] || zone;

export const getZoneForStatus = (status: string): BinZone | undefined =>
  STATUS_TO_ZONE_MAP[status as AssemblyStatus];

export const getStatusColor = (status: string): string =>
  STATUS_COLORS[status as AssemblyStatus] || '#6b7280';

export const getZoneColor = (zone: string): string =>
  ZONE_COLORS[zone as BinZone] || '#6b7280';

export const getProgressPercentage = (status: string): number => {
  const index = STATUS_ORDER.indexOf(status as AssemblyStatus);
  if (index === -1) return 0;
  return Math.round(((index + 1) / STATUS_ORDER.length) * 100);
};

export const isStatusComplete = (status: string): boolean =>
  status === 'ready_for_sale';

export const getNextStatus = (currentStatus: string): AssemblyStatus | null => {
  const index = STATUS_ORDER.indexOf(currentStatus as AssemblyStatus);
  if (index === -1 || index === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[index + 1];
};
