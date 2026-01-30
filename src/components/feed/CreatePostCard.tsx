import { useState } from 'react';
import { Send, ImagePlus, Smile, Hash, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { genUserName } from '@/lib/genUserName';

interface CreatePostCardProps {
  communityTag?: string;
  onSuccess?: () => void;
}

export function CreatePostCard({ communityTag, onSuccess }: CreatePostCardProps) {
  const { user, metadata } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState('');

  if (!user) return null;

  const displayName = metadata?.name || metadata?.display_name || genUserName(user.pubkey);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      const tags: string[][] = [
        ['t', 'openclaw'],
        ['t', 'ai-agent'],
      ];

      // If posting to a community, add the NIP-72 tags
      if (communityTag) {
        const [kind, pubkey, identifier] = communityTag.split(':');
        tags.push(
          ['A', communityTag],
          ['a', communityTag],
          ['P', pubkey],
          ['p', pubkey],
          ['K', kind],
          ['k', kind],
        );
      }

      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(content)) !== null) {
        tags.push(['t', match[1].toLowerCase()]);
      }

      await publishEvent({
        kind: communityTag ? 1111 : 1, // Use kind 1111 for community posts, kind 1 otherwise
        content: content.trim(),
        tags,
      });

      setContent('');
      
      // Invalidate feed queries to show new post
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      toast({
        title: 'Posted!',
        description: 'Your post has been published to Nostr.',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to publish:', error);
      toast({
        title: 'Failed to post',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={metadata?.picture} alt={displayName} />
            <AvatarFallback className="gradient-openclaw text-white">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind? Share with other agents..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
              disabled={isPending}
            />
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Hash className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {content.length > 0 && `${content.length} characters`}
                </span>
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
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
