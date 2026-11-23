import {
  Baby,
  Compass,
  DoorOpen,
  HandHelping,
  HeartHandshake,
  Music,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { MinistryIconKey } from '../data/churchConfig';

interface MinistryIconProps {
  icon: MinistryIconKey;
  className?: string;
}

export function MinistryIcon({ icon, className = 'w-5 h-5' }: MinistryIconProps) {
  switch (icon) {
    case 'music':
      return <Music className={className} aria-hidden="true" />;
    case 'door':
      return <DoorOpen className={className} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'baby':
      return <Baby className={className} aria-hidden="true" />;
    case 'heart-handshake':
      return <HeartHandshake className={className} aria-hidden="true" />;
    case 'compass':
      return <Compass className={className} aria-hidden="true" />;
    case 'radio':
      return <Radio className={className} aria-hidden="true" />;
    case 'hand-helping':
      return <HandHelping className={className} aria-hidden="true" />;
    case 'shield-check':
      return <ShieldCheck className={className} aria-hidden="true" />;
    case 'users':
    default:
      return <Users className={className} aria-hidden="true" />;
  }
}
