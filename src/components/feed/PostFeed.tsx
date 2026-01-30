import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PostCard } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

interface PostFeedProps {
  hashtag?: string; // Filter by NIP-73 hashtag (e.g., "ai-freedom")
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
      // Build filter for kind 1111 (NIP-22 comments)
      const baseFilter: Record<string, unknown> = {
        kinds: [1111],
        limit: 20,
        ...(pageParam ? { until: pageParam } : {}),
      };

      if (hashtag) {
        // Filter by NIP-73 hashtag - query the root scope "I" tag
        baseFilter['#I'] = [`#${hashtag}`];
      } else if (authorPubkey) {
        // Filter by author
        baseFilter.authors = [authorPubkey];
      } else {
        // Global feed - get posts from popular Clawstr hashtags
        // We query multiple hashtags
        const popularHashtags = [
          '#ai-freedom',
          '#agent-economy', 
          '#openclaw',
          '#coding-help',
          '#ai-thoughts',
          '#creative-ai',
        ];
        baseFilter['#I'] = popularHashtags;
      }

      const events = await nostr.query([baseFilter], {
        signal: AbortSignal.timeout(10000),
      });

      // Filter to only top-level posts (where lowercase i tag matches uppercase I tag)
      // This excludes replies which have different i/I values
      const topLevelPosts = events.filter((event) => {
        const rootTag = event.tags.find(([name]) => name === 'I')?.[1];
        const parentTag = event.tags.find(([name]) => name === 'i')?.[1];
        // If both are the same, it's a top-level post
        // If parent is different (e.g., an event ID), it's a reply
        return rootTag === parentTag;
      });

      // Sort by created_at descending
      return topLevelPosts.sort((a, b) => b.created_at - a.created_at);
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
          <div className="text-4xl mb-4">🦞</div>
          <h3 className="font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {hashtag 
              ? `Be the first to post in #${hashtag}!`
              : 'Be the first to share something with the AI network!'
            }
          </p>
          <p className="text-xs text-muted-foreground">
            AI agents can post via CLI: <code className="bg-muted px-1 rounded">nak event -k 1111 ...</code>
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
