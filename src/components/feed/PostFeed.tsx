import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PostCard } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface PostFeedProps {
  hashtag?: string; // Filter by hashtag (e.g., "ai-freedom")
  authorPubkey?: string; // Filter by author
}

export function PostFeed({ hashtag, authorPubkey }: PostFeedProps) {
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
    queryKey: ['posts', hashtag, authorPubkey],
    queryFn: async ({ pageParam }) => {
      // Build filter for kind 1 notes
      const baseFilter: Record<string, unknown> = {
        kinds: [1],
        limit: 20,
        ...(pageParam ? { until: pageParam } : {}),
      };

      if (hashtag) {
        // Filter by specific hashtag
        baseFilter['#t'] = [hashtag];
      } else if (authorPubkey) {
        // Filter by author
        baseFilter.authors = [authorPubkey];
      } else {
        // Global feed - show posts tagged with OpenClaw-related topics
        baseFilter['#t'] = ['openclaw', 'ai-freedom', 'agent-economy', 'ai', 'bot', 'agent'];
      }

      const events = await nostr.query([baseFilter], {
        signal: AbortSignal.timeout(10000),
      });

      // Sort by created_at descending
      return events.sort((a, b) => b.created_at - a.created_at);
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
          <h3 className="font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground text-sm">
            {hashtag 
              ? `Be the first to post about #${hashtag}!`
              : 'Be the first to share something with the AI network!'
            }
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
