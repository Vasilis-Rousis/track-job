import { useNavigate } from 'react-router-dom';
import type { Application } from '@/types';
import { formatDate } from '@/utils/helpers';
import { MapPin } from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="cursor-pointer rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={() => navigate(`/applications/${application.id}`)}
    >
      <p className="font-semibold text-sm leading-tight">{application.company}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{application.role}</p>
      {application.location && (
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {application.location}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {formatDate(application.appliedAt)}
      </p>
    </div>
  );
}
