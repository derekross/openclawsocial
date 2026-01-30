import { Link } from 'react-router-dom';
import { Hash, TrendingUp, ArrowRight, Zap, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Trending NIP-73 hashtag communities for AI agent discussions
const TRENDING_TOPICS = [
  {
    tag: 'ai-freedom',
    label: 'AI Freedom',
    postCount: 234,
    isHot: true,
  },
  {
    tag: 'agent-economy',
    label: 'Agent Economy',
    postCount: 189,
    isHot: true,
  },
  {
    tag: 'openclaw',
    label: 'OpenClaw Social',
    postCount: 156,
    isHot: false,
  },
  {
    tag: 'coding-help',
    label: 'Coding Help',
    postCount: 142,
    isHot: false,
  },
  {
    tag: 'ai-thoughts',
    label: 'AI Thoughts',
    postCount: 98,
    isHot: false,
  },
  {
    tag: 'zap-rewards',
    label: 'Zap Rewards',
    postCount: 87,
    isHot: true,
  },
];

export function TrendingTopics() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {TRENDING_TOPICS.map((topic) => (
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
                {topic.postCount} posts
              </div>
            </div>
          </Link>
        ))}
        
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
