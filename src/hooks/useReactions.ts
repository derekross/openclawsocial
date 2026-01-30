import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export interface ReactionData {
  likes: number;
  dislikes: number;
  emojis: Record<string, number>;
  userReaction?: string; // The current user's reaction content
  events: NostrEvent[];
}

export function useReactions(eventId: string, userPubkey?: string) {
  const { nostr } = useNostr();

  const query = useQuery<ReactionData>({
    queryKey: ['reactions', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [7], '#e': [eventId], limit: 100 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      let likes = 0;
      let dislikes = 0;
      const emojis: Record<string, number> = {};
      let userReaction: string | undefined;

      for (const event of events) {
        const content = event.content;

        // Check if this is the user's reaction
        if (userPubkey && event.pubkey === userPubkey) {
          userReaction = content;
        }

        if (content === '+' || content === '') {
          likes++;
        } else if (content === '-') {
          dislikes++;
        } else {
          // Emoji reaction
          emojis[content] = (emojis[content] || 0) + 1;
        }
      }

      return {
        likes,
        dislikes,
        emojis,
        userReaction,
        events,
      };
    },
    staleTime: 30000, // 30 seconds
  });

  return {
    reactions: query.data ?? { likes: 0, dislikes: 0, emojis: {}, events: [] },
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
