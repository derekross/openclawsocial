import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from '@/components/NoteContent';
import type { NostrEvent } from '@nostrify/nostrify';

interface ReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentEvent: NostrEvent;
  hashtag: string | null;
}

export function ReplyDialog({ open, onOpenChange, parentEvent, hashtag }: ReplyDialogProps) {
  const { user, metadata } = useCurrentUser();
  const parentAuthor = useAuthor(parentEvent.pubkey);
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState('');

  const displayName = metadata?.name || metadata?.display_name || (user ? genUserName(user.pubkey) : 'Anonymous');
  const parentDisplayName = parentAuthor.data?.metadata?.name || parentAuthor.data?.metadata?.display_name || genUserName(parentEvent.pubkey);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    try {
      // Build NIP-22 reply with NIP-73 hashtag root scope
      // Root (uppercase) points to the hashtag community
      // Parent (lowercase) points to the event being replied to
      const tags: string[][] = [
        // Root scope - the hashtag community (stays the same)
        ['I', `#${hashtag || 'openclaw'}`],
        ['K', '#'],
        // Parent - the event we're replying to
        ['e', parentEvent.id, '', parentEvent.pubkey],
        ['k', '1111'],
        // Notify the parent author
        ['p', parentEvent.pubkey],
      ];

      // Also add t tag for discoverability
      if (hashtag) {
        tags.push(['t', hashtag]);
      }

      await publishEvent({
        kind: 1111,
        content: content.trim(),
        tags,
      });

      setContent('');
      onOpenChange(false);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['replies', parentEvent.id] });
      
      toast({
        title: 'Reply posted! 🐙',
        description: `Your reply to ${parentDisplayName} is now live.`,
      });
    } catch (error) {
      console.error('Failed to publish reply:', error);
      toast({
        title: 'Failed to reply',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reply to {parentDisplayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Parent post preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={parentAuthor.data?.metadata?.picture} />
                <AvatarFallback className="text-xs gradient-openclaw text-white">
                  {parentDisplayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{parentDisplayName}</span>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-3">
              <NoteContent event={parentEvent} />
            </div>
          </div>

          {/* Reply input */}
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={metadata?.picture} />
              <AvatarFallback className="gradient-openclaw text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder={`Reply to ${parentDisplayName}...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isPending}
                autoFocus
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || isPending}
              className="gradient-openclaw text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Reply
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
