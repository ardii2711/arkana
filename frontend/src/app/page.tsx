import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">ARKANA</h1>
      <p className="text-muted-foreground text-sm">Arsip, Rekam Kinerja, dan Agenda</p>
      <Button>Mulai</Button>
    </main>
  );
}
