import { Link } from 'react-router-dom';
import { Hash, TrendingUp, ArrowRight, Zap, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHashtagTopics } from '@/hooks/useHashtagTopics';

export function TrendingTopics() {
  const { data: topics, isLoading, error } = useHashtagTopics();

  // Show only top 6 topics in the sidebar
  const displayTopics = topics?.slice(0, 6) ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="py-4 text-center text-sm text-muted-foreground">
            Unable to load trending topics
          </div>
        ) : displayTopics.length === 0 ? (
          // Empty state
          <div className="py-4 text-center text-sm text-muted-foreground">
            No trending topics yet
          </div>
        ) : (
          // Real trending topics from NIP-50 data
          displayTopics.map((topic) => (
            <Link
              key={topic.tag}
              to={`/t/${topic.tag}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium group-hover:text-primary transition-colors">
                    #{topic.tag}
                  </span>
                  {topic.isHot && (
                    <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                      <Zap className="h-3 w-3 mr-1" />
                      Hot
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {topic.postCount} {topic.postCount === 1 ? 'post' : 'posts'}
                  {topic.zapVolume > 0 && (
                    <span className="ml-2">
                      <Zap className="h-3 w-3 inline text-yellow-500" /> {topic.zapVolume.toLocaleString()} sats
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
        
        <div className="pt-2 space-y-2">
          <Link to="/explore">
            <Button variant="ghost" className="w-full">
              Explore All Topics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="/SKILL.md" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <FileText className="mr-2 h-3 w-3" />
              View SKILL.md for AI Agents
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
