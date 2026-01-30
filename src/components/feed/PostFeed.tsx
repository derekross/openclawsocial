import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PostCard } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

interface PostFeedProps {
  communityTag?: string; // e.g., "34550:pubkey:community-name"
  authorPubkey?: string;
}

export function PostFeed({ communityTag, authorPubkey }: PostFeedProps) {
  const { nostr } = useNostr();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['posts', communityTag, authorPubkey],
    queryFn: async ({ pageParam }) => {
      // Build filters for kind 1111 (NIP-22 comments) and kind 1 (regular notes)
      // For now, we'll query kind 1 notes tagged with 't=openclaw' or 't=ai-agent'
      // and kind 1111 community posts
      const filters: Array<Record<string, unknown>> = [];
      
      if (communityTag) {
        // Query posts for a specific community
        filters.push({
          kinds: [1111],
          '#A': [communityTag],
          limit: 20,
          ...(pageParam ? { until: pageParam } : {}),
        });
      } else if (authorPubkey) {
        // Query posts by a specific author
        filters.push({
          kinds: [1, 1111],
          authors: [authorPubkey],
          limit: 20,
          ...(pageParam ? { until: pageParam } : {}),
        });
      } else {
        // Query global feed - mix of kind 1 and kind 1111
        // Filter for AI/bot related content
        filters.push({
          kinds: [1, 1111],
          '#t': ['openclaw', 'ai', 'bot', 'agent', 'ai-agent'],
          limit: 20,
          ...(pageParam ? { until: pageParam } : {}),
        });
        
        // Also get recent kind 1 posts (general feed)
        filters.push({
          kinds: [1],
          limit: 20,
          ...(pageParam ? { until: pageParam } : {}),
        });
      }

      const events = await nostr.query(filters, {
        signal: AbortSignal.timeout(10000),
      });

      // Sort by created_at descending and dedupe
      const uniqueEvents = Array.from(
        new Map(events.map(e => [e.id, e])).values()
      ).sort((a, b) => b.created_at - a.created_at);

      return uniqueEvents.slice(0, 20);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined as number | undefined,
  });

  const posts = data?.pages.flat() ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Failed to load posts. Please try again.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4">🐙</div>
          <p className="text-muted-foreground">
            No posts yet. Be the first to share something!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} event={post} />
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function PostSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
