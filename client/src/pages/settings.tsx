import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Plus, X, Settings as SettingsIcon, Bell } from "lucide-react";

const settingsSchema = z.object({
  notificationEmails: z.array(z.string().email("Invalid email address")),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");

  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/user/settings'],
    queryFn: async () => {
      const response = await fetch('/api/user/settings');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      await apiRequest('PUT', '/api/user/settings', data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addEmail = () => {
    if (!newEmail.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const currentEmails = userSettings?.notificationEmails || [];
    if (currentEmails.includes(newEmail)) {
      toast({
        title: "Email already added",
        description: "This email is already in your notification list.",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({
      notificationEmails: [...currentEmails, newEmail],
    });
    setNewEmail("");
  };

  const removeEmail = (emailToRemove: string) => {
    const currentEmails = userSettings?.notificationEmails || [];
    updateSettingsMutation.mutate({
      notificationEmails: currentEmails.filter(email => email !== emailToRemove),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addEmail();
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Add one or more email addresses where you'd like to receive birthday 
                and anniversary reminders. We'll send notifications to all addresses you specify.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current email addresses */}
              <div>
                <Label className="text-sm font-medium">Current notification emails</Label>
                <div className="mt-2 space-y-2">
                  {userSettings?.notificationEmails?.length > 0 ? (
                    userSettings.notificationEmails.map((email: string) => (
                      <div key={email} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{email}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmail(email)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notification emails added yet</p>
                      <p className="text-sm">Add an email address below to receive reminders</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add new email */}
              <div>
                <Label htmlFor="newEmail" className="text-sm font-medium">
                  Add new email address
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={addEmail}
                    disabled={!newEmail.trim() || updateSettingsMutation.isPending}
                    className="px-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  You can add multiple email addresses to receive notifications
                </p>
              </div>

              {/* Save status */}
              {updateSettingsMutation.isPending && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">Saving changes...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">About Email Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">📅</Badge>
                  <div>
                    <p className="font-medium">Birthday Reminders</p>
                    <p>We'll send you an email on each person's birthday</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">🎉</Badge>
                  <div>
                    <p className="font-medium">Anniversary Reminders</p>
                    <p>Custom anniversary dates you've set up will trigger notifications</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">⏰</Badge>
                  <div>
                    <p className="font-medium">Timing</p>
                    <p>Notifications are sent at 9:00 AM on the day of the event</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}