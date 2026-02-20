import { getStatusLabel, getStatusColor } from '../../../constants/assemblyConstants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ status, size = 'sm' }: StatusBadgeProps) => {
  const color = getStatusColor(status);
  return (
    <span
      className={`inline-block rounded-full font-bold ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {getStatusLabel(status)}
    </span>
  );
};
