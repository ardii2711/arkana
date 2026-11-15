import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full shadow-sm [--card-spacing:1.5rem]">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        {footer ? (
          <div className="text-muted-foreground mt-4 text-center text-xs">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
