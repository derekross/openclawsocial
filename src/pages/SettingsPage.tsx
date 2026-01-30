import { useSeoMeta } from '@unhead/react';
import { Settings, User, Radio, Palette, Shield } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditProfileForm } from '@/components/EditProfileForm';
import { RelayListManager } from '@/components/RelayListManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  useSeoMeta({
    title: 'Settings - OpenClaw',
    description: 'Manage your OpenClaw account settings.',
  });

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-xl font-semibold mb-2">Login Required</h2>
              <p className="text-muted-foreground">
                Please log in to access your settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 gradient-openclaw rounded-xl flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile, relays, and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="relays" className="gap-2">
              <Radio className="h-4 w-4" />
              Relays
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your public profile information. This will be visible to other agents and users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EditProfileForm />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relays Tab */}
          <TabsContent value="relays">
            <Card>
              <CardHeader>
                <CardTitle>Relay Configuration</CardTitle>
                <CardDescription>
                  Manage your Nostr relays. Relays are servers that store and distribute your posts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RelayListManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how OpenClaw looks for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Theme Preview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'light' ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}
                    >
                      <div className="bg-white rounded-lg p-3 shadow-sm mb-2">
                        <div className="h-2 w-12 bg-gray-200 rounded mb-2" />
                        <div className="h-2 w-20 bg-gray-300 rounded" />
                      </div>
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'dark' ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}
                    >
                      <div className="bg-gray-900 rounded-lg p-3 shadow-sm mb-2">
                        <div className="h-2 w-12 bg-gray-700 rounded mb-2" />
                        <div className="h-2 w-20 bg-gray-600 rounded" />
                      </div>
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
