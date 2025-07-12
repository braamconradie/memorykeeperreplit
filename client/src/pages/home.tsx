import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/navigation";
import { AddMemoryModal } from "@/components/add-memory-modal";
import { AddPersonModal } from "@/components/add-person-modal";
import { AddReminderModal } from "@/components/add-reminder-modal";
import { ReminderCard } from "@/components/reminder-card";
import { Plus, Users, Heart, Bell, Star, Calendar, CalendarDays, ArrowRight, Gift } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: upcomingReminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['/api/reminders/upcoming'],
    queryFn: async () => {
      const response = await fetch('/api/reminders/upcoming?days=30');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch reminders');
      }
      return response.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
  });

  const { data: recentMemories, isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories'],
    queryFn: async () => {
      const response = await fetch('/api/memories?limit=3');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch memories');
      }
      return response.json();
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Group reminders by time periods
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const todayReminders = upcomingReminders?.filter(r => r.reminderDate === todayStr) || [];
  const thisWeekReminders = upcomingReminders?.filter(r => 
    r.reminderDate > todayStr && r.reminderDate <= weekFromNow
  ) || [];
  const laterReminders = upcomingReminders?.filter(r => r.reminderDate > weekFromNow) || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upcoming Reminders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Next 30 Days</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {remindersLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    {/* Today's Reminders */}
                    {todayReminders.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-neutral-600 mb-3 flex items-center">
                          <Star className="h-4 w-4 text-secondary mr-2" />
                          Today
                        </h3>
                        <div className="space-y-3">
                          {todayReminders.map((reminder) => (
                            <ReminderCard key={reminder.id} reminder={reminder} priority="high" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* This Week */}
                    {thisWeekReminders.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-neutral-600 mb-3 flex items-center">
                          <CalendarDays className="h-4 w-4 text-primary mr-2" />
                          This Week
                        </h3>
                        <div className="space-y-3">
                          {thisWeekReminders.map((reminder) => (
                            <ReminderCard key={reminder.id} reminder={reminder} priority="medium" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Later This Month */}
                    {laterReminders.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-600 mb-3 flex items-center">
                          <Calendar className="h-4 w-4 text-neutral-400 mr-2" />
                          Later This Month
                        </h3>
                        <div className="space-y-3">
                          {laterReminders.map((reminder) => (
                            <ReminderCard key={reminder.id} reminder={reminder} priority="low" />
                          ))}
                        </div>
                      </div>
                    )}

                    {upcomingReminders?.length === 0 && (
                      <div className="text-center py-8 text-neutral-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                        <p>No upcoming reminders in the next 30 days</p>
                        <p className="text-sm mt-2">Add some people to start tracking important dates!</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-between" 
                  onClick={() => setShowAddMemory(true)}
                >
                  <span className="flex items-center">
                    <Plus className="h-4 w-4 mr-3" />
                    Add Memory
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setShowAddPerson(true)}
                >
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-3" />
                    Add Person
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setShowAddReminder(true)}
                >
                  <span className="flex items-center">
                    <Gift className="h-4 w-4 mr-3" />
                    Add Birthday/Anniversary
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => window.location.href = '/timeline'}
                >
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-3" />
                    Search Memories
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Memory Bank</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-neutral-600">People</span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        {stats?.peopleCount || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <Heart className="h-4 w-4 text-accent" />
                        </div>
                        <span className="text-neutral-600">Memories</span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        {stats?.memoriesCount || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Bell className="h-4 w-4 text-secondary" />
                        </div>
                        <span className="text-neutral-600">Reminders</span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        {stats?.remindersCount || 0}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* This Week in Memories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Memories</CardTitle>
              </CardHeader>
              <CardContent>
                {memoriesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : recentMemories?.length > 0 ? (
                  <div className="space-y-3">
                    {recentMemories.map((memory) => (
                      <div key={memory.id} className="p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm text-neutral-600 mb-1">
                          {memory.person?.fullName} - {new Date(memory.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-neutral-800 line-clamp-2">{memory.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-neutral-500">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                    <p className="text-sm">No memories yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddMemoryModal 
        open={showAddMemory} 
        onOpenChange={setShowAddMemory}
      />
      <AddPersonModal 
        open={showAddPerson} 
        onOpenChange={setShowAddPerson}
      />
      <AddReminderModal 
        open={showAddReminder} 
        onOpenChange={setShowAddReminder}
      />
    </div>
  );
}
