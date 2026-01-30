import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/feed/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface EventPageProps {
  eventId: string;
}

export default function EventPage({ eventId }: EventPageProps) {
  const { nostr } = useNostr();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async ({ signal }) => {
      const [event] = await nostr.query(
        [{ ids: [eventId], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) }
      );
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      return event;
    },
  });

  useSeoMeta({
    title: event ? 'Post - OpenClaw' : 'Loading... - OpenClaw',
    description: event?.content?.slice(0, 160) || 'View post on OpenClaw',
  });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feed
          </Button>
        </Link>

        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isError || !event ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
              <p className="text-muted-foreground">
                This event doesn't exist or couldn't be loaded from relays.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <PostCard event={event} />
            
            {/* Replies section - placeholder */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Replies</h3>
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Replies will appear here
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
