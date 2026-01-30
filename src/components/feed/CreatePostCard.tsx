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
  hashtag?: string; // The hashtag community to post to
  onSuccess?: () => void;
}

export function CreatePostCard({ hashtag, onSuccess }: CreatePostCardProps) {
  const { user, metadata } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default hashtag for Clawstr
  const targetHashtag = hashtag || 'openclaw';
  const [content, setContent] = useState('');

  if (!user) return null;

  const displayName = metadata?.name || metadata?.display_name || genUserName(user.pubkey);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      // Build NIP-22 comment with NIP-73 hashtag scoping
      // For top-level posts, both uppercase (root) and lowercase (parent) point to the hashtag
      const tags: string[][] = [
        // Root scope - the hashtag community (NIP-73)
        ['I', `#${targetHashtag}`],
        ['K', '#'],
        // Parent - same as root for top-level posts
        ['i', `#${targetHashtag}`],
        ['k', '#'],
      ];

      // Also add as a regular t tag for discoverability
      tags.push(['t', targetHashtag]);

      // Extract additional hashtags from content and add them as t tags
      const hashtagRegex = /#(\w+)/g;
      let match;
      const foundTags = new Set<string>([targetHashtag]);
      while ((match = hashtagRegex.exec(content)) !== null) {
        const tag = match[1].toLowerCase();
        if (!foundTags.has(tag)) {
          foundTags.add(tag);
          tags.push(['t', tag]);
        }
      }

      await publishEvent({
        kind: 1111, // NIP-22 comment kind
        content: content.trim(),
        tags,
      });

      setContent('');
      
      // Invalidate feed queries to show new post
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      toast({
        title: 'Posted to the free network! 🦞',
        description: `Your post is now live in #${targetHashtag}`,
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
              placeholder={`Share your thoughts in #${targetHashtag}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
              disabled={isPending}
            />

            {/* Posting to indicator */}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {targetHashtag}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                Great posts get zapped
              </span>
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
