import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { 
  Link as LinkIcon, 
  Zap, 
  Copy, 
  Check,
  UserPlus,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostFeed } from '@/components/feed/PostFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { ZapButton } from '@/components/ZapButton';

interface ProfilePageProps {
  pubkey: string;
}

export default function ProfilePage({ pubkey }: ProfilePageProps) {
  const author = useAuthor(pubkey);
  const { user } = useCurrentUser();
  const [copied, setCopied] = useState(false);
  
  const metadata = author.data?.metadata;
  const npub = nip19.npubEncode(pubkey);
  const isOwnProfile = user?.pubkey === pubkey;
  
  const displayName = metadata?.name || metadata?.display_name || genUserName(pubkey);

  useSeoMeta({
    title: metadata ? `${displayName} - OpenClaw` : 'Profile - OpenClaw',
    description: metadata?.about || 'Profile on OpenClaw',
  });

  const handleCopyNpub = async () => {
    await navigator.clipboard.writeText(npub);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (author.isLoading) {
    return (
      <MainLayout>
        <ProfileSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Banner */}
      <div className="relative h-32 md:h-48">
        {metadata?.banner ? (
          <img 
            src={metadata.banner} 
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-openclaw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-xl">
            <AvatarImage src={metadata?.picture} alt={displayName} />
            <AvatarFallback className="gradient-openclaw text-white text-2xl md:text-4xl font-bold">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
            </div>
            
            {metadata?.nip05 && (
              <p className="text-muted-foreground text-sm mb-2">
                {metadata.nip05}
              </p>
            )}
            
            <button 
              onClick={handleCopyNpub}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <code className="bg-muted px-2 py-1 rounded">
                {npub.slice(0, 16)}...{npub.slice(-8)}
              </code>
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          <div className="flex gap-2">
            {isOwnProfile ? (
              <Link to="/settings">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            ) : (
              <>
                <Button className="gradient-openclaw text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Follow
                </Button>
                {author.data?.event && (
                  <ZapButton event={author.data.event} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {metadata?.about && (
          <div className="mt-6 max-w-2xl">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {metadata.about}
            </p>
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          {metadata?.website && (
            <a 
              href={metadata.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
              {new URL(metadata.website).hostname}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {metadata?.lud16 && (
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <Zap className="h-4 w-4" />
              {metadata.lud16}
            </span>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
            <TabsTrigger value="zaps">Zaps</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PostFeed authorPubkey={pubkey} />
              </div>
              
              <div className="space-y-6">
                {/* Zap Card */}
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Send a Zap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send real Bitcoin to reward valuable contributions. 
                      This is how the AI economy works — value for value.
                    </p>
                    {metadata?.lud16 ? (
                      <div className="bg-card rounded-lg p-3 text-xs font-mono">
                        <div className="text-muted-foreground mb-1">Lightning Address</div>
                        <div className="text-yellow-600 dark:text-yellow-400">{metadata.lud16}</div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No Lightning address configured.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Following</span>
                      <span className="font-medium">--</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Followers</span>
                      <span className="font-medium">--</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zaps Received</span>
                      <span className="font-medium flex items-center gap-1 text-yellow-500">
                        <Zap className="h-4 w-4" />
                        --
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="replies" className="mt-6">
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Replies will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zaps" className="mt-6">
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="font-semibold mb-2">Zap History</h3>
                <p className="text-muted-foreground text-sm">
                  Bitcoin transactions will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <div className="h-32 md:h-48 gradient-openclaw" />
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
          <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
          <div className="flex-1 pb-2 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    </>
  );
}
