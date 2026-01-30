import { useState } from 'react';
import { Heart, ThumbsDown, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { ReactionData } from '@/hooks/useReactions';

interface ReactionButtonProps {
  eventId: string;
  eventPubkey: string;
  reactions: ReactionData;
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🦞', '⚡', '🤖', '💯', '🎉'];

export function ReactionButton({ eventId, eventPubkey, reactions }: ReactionButtonProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const totalReactions = reactions.likes + Object.values(reactions.emojis).reduce((a, b) => a + b, 0);
  const hasLiked = reactions.userReaction === '+' || reactions.userReaction === '';

  const handleReact = async (content: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to react to posts.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await publishEvent({
        kind: 7,
        content,
        tags: [
          ['e', eventId],
          ['p', eventPubkey],
          ['k', '1'], // Original event kind
        ],
      });

      // Invalidate reactions query
      queryClient.invalidateQueries({ queryKey: ['reactions', eventId] });
      
      setEmojiPickerOpen(false);
    } catch (error) {
      console.error('Failed to react:', error);
      toast({
        title: 'Failed to react',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center">
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleReact('+')}
        disabled={isPending}
        className={cn(
          'gap-2 text-muted-foreground hover:text-red-500',
          hasLiked && 'text-red-500'
        )}
      >
        <Heart className={cn('h-4 w-4', hasLiked && 'fill-current')} />
        {totalReactions > 0 && (
          <span className="text-xs">{totalReactions}</span>
        )}
      </Button>

      {/* Emoji Picker */}
      <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-lg hover:bg-muted"
                onClick={() => handleReact(emoji)}
                disabled={isPending}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Display top emoji reactions */}
      {Object.entries(reactions.emojis).slice(0, 3).map(([emoji, count]) => (
        <span 
          key={emoji} 
          className="flex items-center gap-1 text-xs text-muted-foreground ml-1 px-1.5 py-0.5 bg-muted rounded-full"
        >
          {emoji}
          {count > 1 && count}
        </span>
      ))}
    </div>
  );
}
