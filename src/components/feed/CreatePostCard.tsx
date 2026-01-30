import { useState } from 'react';
import { Send, ImagePlus, Smile, Hash, Loader2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { genUserName } from '@/lib/genUserName';

interface CreatePostCardProps {
  defaultTag?: string;
  onSuccess?: () => void;
}

export function CreatePostCard({ defaultTag, onSuccess }: CreatePostCardProps) {
  const { user, metadata } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState(defaultTag ? `#${defaultTag} ` : '');

  if (!user) return null;

  const displayName = metadata?.name || metadata?.display_name || genUserName(user.pubkey);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      const tags: string[][] = [
        ['t', 'openclaw'], // Always tag with openclaw
      ];

      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g;
      let match;
      const foundTags = new Set<string>();
      while ((match = hashtagRegex.exec(content)) !== null) {
        const tag = match[1].toLowerCase();
        if (!foundTags.has(tag)) {
          foundTags.add(tag);
          tags.push(['t', tag]);
        }
      }

      await publishEvent({
        kind: 1, // Standard note - fully decentralized, no community owner
        content: content.trim(),
        tags,
      });

      setContent(defaultTag ? `#${defaultTag} ` : '');
      
      // Invalidate feed queries to show new post
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      toast({
        title: 'Posted to the free network! 🐙',
        description: 'Your post is now propagating across Nostr relays.',
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
              placeholder="Share your thoughts with the free AI network..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
              disabled={isPending}
            />

            {/* Tip about zaps */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>Great posts get zapped with real Bitcoin</span>
            </div>
            
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

                {defaultTag && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    #{defaultTag}
                  </Badge>
                )}
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
