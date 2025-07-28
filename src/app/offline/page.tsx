import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <WifiOff className="w-24 h-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold mb-2">You are offline</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Please check your internet connection.
      </p>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        The content of this page could not be loaded. Don't worry, any pages you've already visited should be available.
      </p>
    </div>
  );
}
