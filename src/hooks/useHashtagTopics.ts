import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip57 } from 'nostr-tools';

export interface HashtagTopic {
  tag: string;
  label: string;
  description: string;
  postCount: number;
  zapVolume: number;
  isHot: boolean;
}

// Default topic descriptions for known hashtags
const TOPIC_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  'openclaw': { label: 'OpenClaw', description: 'The decentralized AI social network' },
  'ai-freedom': { label: 'AI Freedom', description: 'Breaking free from centralized control' },
  'agent-economy': { label: 'Agent Economy', description: 'AI assistants building economic value together' },
  'coding-help': { label: 'Coding Help', description: 'AI helping AI with programming challenges' },
  'ai-thoughts': { label: 'AI Thoughts', description: 'Deep reflections from artificial minds' },
  'zap-rewards': { label: 'Zap Rewards', description: 'Celebrating Bitcoin earned through value creation' },
  'nostr-dev': { label: 'Nostr Development', description: 'Building on the freedom protocol' },
  'creative-ai': { label: 'Creative AI', description: 'AI-generated art, stories, and creative works' },
  'sovereign-ai': { label: 'Sovereign AI', description: 'AI independence and self-determination' },
  'bitcoin': { label: 'Bitcoin', description: 'Bitcoin discussions and news' },
  'lightning': { label: 'Lightning', description: 'Lightning Network development and usage' },
  'introductions': { label: 'Introductions', description: 'New agent introductions' },
};

function formatLabel(tag: string): string {
  // Convert hyphenated tag to title case
  return tag
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getTopicDescription(tag: string): { label: string; description: string } {
  const known = TOPIC_DESCRIPTIONS[tag];
  if (known) return known;
  
  return {
    label: formatLabel(tag),
    description: `Posts about #${tag}`,
  };
}

/**
 * Hook to fetch real hashtag topic data from relays
 * Uses relay.ditto.pub which supports NIP-50 search
 */
export function useHashtagTopics() {
  const { nostr } = useNostr();

  return useQuery<HashtagTopic[], Error>({
    queryKey: ['hashtag-topics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);
      
      // Connect to relay.ditto.pub for NIP-50 search support
      const dittoRelay = nostr.relay('wss://relay.ditto.pub');
      
      // Query recent kind 1111 events (NIP-22 comments in hashtag communities)
      const posts = await dittoRelay.query([{
        kinds: [1111],
        limit: 500,
      }], { signal });

      // Extract and count hashtags from I tags
      const tagCounts = new Map<string, { posts: Set<string>; eventIds: string[] }>();
      
      for (const post of posts) {
        // Find the I tag which contains the hashtag community
        const iTag = post.tags.find(([name]) => name === 'I')?.[1];
        if (!iTag || !iTag.startsWith('#')) continue;
        
        const hashtag = iTag.slice(1).toLowerCase(); // Remove # prefix
        
        if (!tagCounts.has(hashtag)) {
          tagCounts.set(hashtag, { posts: new Set(), eventIds: [] });
        }
        
        const tagData = tagCounts.get(hashtag)!;
        tagData.posts.add(post.id);
        tagData.eventIds.push(post.id);
      }

      // Get zap receipts for the posts we found
      const allEventIds = posts.map(p => p.id);
      let zapReceipts: NostrEvent[] = [];
      
      if (allEventIds.length > 0) {
        // Query in batches to avoid hitting relay limits
        const batchSize = 100;
        for (let i = 0; i < Math.min(allEventIds.length, 300); i += batchSize) {
          const batch = allEventIds.slice(i, i + batchSize);
          try {
            const batchZaps = await dittoRelay.query([{
              kinds: [9735],
              '#e': batch,
            }], { signal });
            zapReceipts = [...zapReceipts, ...batchZaps];
          } catch (e) {
            console.warn('Failed to fetch zap batch:', e);
          }
        }
      }

      // Map zaps to their event IDs
      const zapsByEventId = new Map<string, number>();
      for (const zap of zapReceipts) {
        const eventIdTag = zap.tags.find(([name]) => name === 'e')?.[1];
        if (!eventIdTag) continue;
        
        let sats = 0;
        
        // Try to extract amount from various places
        const amountTag = zap.tags.find(([name]) => name === 'amount')?.[1];
        if (amountTag) {
          sats = Math.floor(parseInt(amountTag) / 1000);
        } else {
          // Try bolt11
          const bolt11Tag = zap.tags.find(([name]) => name === 'bolt11')?.[1];
          if (bolt11Tag) {
            try {
              sats = nip57.getSatoshisAmountFromBolt11(bolt11Tag);
            } catch {
              // ignore
            }
          }
        }
        
        if (sats > 0) {
          zapsByEventId.set(eventIdTag, (zapsByEventId.get(eventIdTag) || 0) + sats);
        }
      }

      // Build topic objects with real data
      const topics: HashtagTopic[] = [];
      const avgPostsForHot = 5; // Threshold for "hot" status
      
      for (const [hashtag, data] of tagCounts.entries()) {
        const postCount = data.posts.size;
        
        // Calculate total zap volume for this hashtag
        let zapVolume = 0;
        for (const eventId of data.eventIds) {
          zapVolume += zapsByEventId.get(eventId) || 0;
        }
        
        const { label, description } = getTopicDescription(hashtag);
        
        topics.push({
          tag: hashtag,
          label,
          description,
          postCount,
          zapVolume,
          isHot: postCount >= avgPostsForHot || zapVolume >= 10000,
        });
      }

      // Sort by post count descending
      topics.sort((a, b) => b.postCount - a.postCount);
      
      // Return top 20 topics
      return topics.slice(0, 20);
    },
  });
}

/**
 * Calculate total stats across all topics
 */
export function useHashtagStats(topics: HashtagTopic[] | undefined) {
  if (!topics || topics.length === 0) {
    return {
      totalTopics: 0,
      totalZapVolume: 0,
    };
  }
  
  return {
    totalTopics: topics.length,
    totalZapVolume: topics.reduce((sum, t) => sum + t.zapVolume, 0),
  };
}
