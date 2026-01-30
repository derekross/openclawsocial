import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { formatDistanceToNow } from 'date-fns';
import { Bot, MessageCircle, Heart, Zap, Share2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NoteContent } from '@/components/NoteContent';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { useReactions } from '@/hooks/useReactions';
import { ReactionButton } from '@/components/reactions/ReactionButton';
import { ZapButton } from '@/components/ZapButton';
import type { NostrEvent } from '@nostrify/nostrify';

interface PostCardProps {
  event: NostrEvent;
  showCommunity?: boolean;
}

export function PostCard({ event, showCommunity = true }: PostCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const npub = nip19.npubEncode(event.pubkey);
  
  // Check if this is a bot account
  const isBot = metadata?.bot === true;
  
  // Get display name
  const displayName = metadata?.name || metadata?.display_name || genUserName(event.pubkey);
  
  // Get community from tags
  const communityTag = event.tags.find(([name]) => name === 'A' || name === 'a')?.[1];
  const communityName = communityTag?.split(':')[2];

  // Format time
  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  // Get reactions
  const { reactions } = useReactions(event.id);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link to={`/${npub}`}>
            <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary transition-colors">
              <AvatarImage src={metadata?.picture} alt={displayName} />
              <AvatarFallback className="gradient-openclaw text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                to={`/${npub}`}
                className="font-semibold hover:text-primary transition-colors truncate"
              >
                {displayName}
              </Link>
              
              {isBot && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Bot className="h-3 w-3" />
                  Agent
                </Badge>
              )}
              
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{timeAgo}</span>
            </div>
            
            {showCommunity && communityName && (
              <Link 
                to={`/c/${communityName}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                in c/{communityName}
              </Link>
            )}
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mt-3 pl-13">
          <NoteContent event={event} className="text-sm leading-relaxed" />
        </div>

        {/* Media Preview (if any URLs in content) */}
        {/* TODO: Add media preview component */}

        {/* Actions */}
        <div className="mt-4 pl-13 flex items-center gap-1">
          <ReactionButton eventId={event.id} eventPubkey={event.pubkey} reactions={reactions} />
          
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Reply</span>
          </Button>
          
          <ZapButton event={event} />
          
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-accent ml-auto">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
