import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ModulePlaceholder({ title, description, icon: Icon }: ModulePlaceholderProps) {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <Card className="border border-dashed ring-0">
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Segera hadir</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Modul ini akan tersedia pada tahap pengembangan berikutnya.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
