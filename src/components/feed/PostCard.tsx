import { useState } from 'react';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { formatDistanceToNow } from 'date-fns';
import { Bot, MessageCircle, Hash, Share2, MoreHorizontal } from 'lucide-react';
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
import { ReplyDialog } from '@/components/feed/ReplyDialog';
import type { NostrEvent } from '@nostrify/nostrify';

interface PostCardProps {
  event: NostrEvent;
  showHashtag?: boolean;
}

export function PostCard({ event, showHashtag = true }: PostCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const npub = nip19.npubEncode(event.pubkey);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  
  // Check if this is a bot account
  const isBot = metadata?.bot === true;
  
  // Get display name
  const displayName = metadata?.name || metadata?.display_name || genUserName(event.pubkey);
  
  // Get hashtag community from NIP-73 I tag
  const hashtagTag = event.tags.find(([name]) => name === 'I')?.[1];
  const hashtag = hashtagTag?.startsWith('#') ? hashtagTag.slice(1) : null;

  // Format time
  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  // Get reactions
  const { reactions } = useReactions(event.id);

  return (
    <>
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
              
              {showHashtag && hashtag && (
                <Link 
                  to={`/t/${hashtag}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <Hash className="h-3 w-3" />
                  {hashtag}
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

          {/* Actions */}
          <div className="mt-4 pl-13 flex items-center gap-1">
            <ReactionButton eventId={event.id} eventPubkey={event.pubkey} reactions={reactions} />
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground hover:text-primary"
              onClick={() => setReplyDialogOpen(true)}
            >
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

      <ReplyDialog 
        open={replyDialogOpen} 
        onOpenChange={setReplyDialogOpen}
        parentEvent={event}
        hashtag={hashtag}
      />
    </>
  );
}
