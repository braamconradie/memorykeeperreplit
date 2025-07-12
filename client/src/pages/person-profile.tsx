import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/navigation";
import { AddMemoryModal } from "@/components/add-memory-modal";
import { AddReminderModal } from "@/components/add-reminder-modal";
import { EditPersonModal } from "@/components/edit-person-modal";
import { MemoryCard } from "@/components/memory-card";
import { ReminderCard } from "@/components/reminder-card";
import { Plus, Edit, Heart, Bell, User, Calendar, Gift, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";
import { useEffect } from "react";

export default function PersonProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/person/:id");
  const personId = params?.id;
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showEditPerson, setShowEditPerson] = useState(false);

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

  const { data: person, isLoading: personLoading } = useQuery({
    queryKey: ['/api/people', personId],
    queryFn: async () => {
      const response = await fetch(`/api/people/${personId}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch person');
      }
      return response.json();
    },
    enabled: !!personId,
  });

  const { data: memories, isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories', personId],
    queryFn: async () => {
      const response = await fetch(`/api/memories?personId=${personId}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch memories');
      }
      return response.json();
    },
    enabled: !!personId,
  });

  const { data: reminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['/api/reminders', personId],
    queryFn: async () => {
      const response = await fetch(`/api/reminders?personId=${personId}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch reminders');
      }
      return response.json();
    },
    enabled: !!personId,
  });

  if (authLoading || personLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">Person not found</h1>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string, birthYear?: number) => {
    if (birthYear) {
      const currentYear = new Date().getFullYear();
      return currentYear - birthYear;
    }
    return null;
  };

  const getImportantNotes = () => {
    if (!person.notes) return [];
    
    // Split notes by common separators and filter out empty ones
    return person.notes
      .split(/[.!?;]\s+/)
      .filter(note => note.trim().length > 0)
      .slice(0, 3); // Show max 3 important notes
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          {/* Profile Header */}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xl font-medium">
                    {getInitials(person.fullName)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-800">{person.fullName}</h1>
                  <p className="text-neutral-600">{person.relationship}</p>
                  {person.birthDate && (
                    <p className="text-sm text-neutral-500 mt-1">
                      Birthday: {formatDate(person.birthDate)}
                      {calculateAge(person.birthDate, person.birthYear) && (
                        <span> (Age: {calculateAge(person.birthDate, person.birthYear)})</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setShowAddMemory(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Memory
                </Button>
                <Button variant="outline" onClick={() => setShowEditPerson(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Profile Tabs */}
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="memories">Memories</TabsTrigger>
                <TabsTrigger value="events">Events & Reminders</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-800">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-neutral-50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {memories?.length || 0}
                        </div>
                        <div className="text-sm text-neutral-600">Memories</div>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-lg">
                        <div className="text-2xl font-bold text-accent">
                          {reminders?.length || 0}
                        </div>
                        <div className="text-sm text-neutral-600">Reminders</div>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-800">Important Notes</h3>
                    <div className="space-y-3">
                      {getImportantNotes().length > 0 ? (
                        getImportantNotes().map((note, index) => (
                          <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">{note.trim()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                          <p className="text-sm text-neutral-500">No notes yet. Click the Edit button to add important details!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Memories */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4">Recent Memories</h3>
                  {memoriesLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : memories?.length > 0 ? (
                    <div className="space-y-4">
                      {memories.slice(0, 3).map((memory) => (
                        <MemoryCard key={memory.id} memory={memory} compact />
                      ))}
                      {memories.length > 3 && (
                        <div className="text-center">
                          <Button variant="ghost" onClick={() => {
                            const memoryTab = document.querySelector('[data-state="inactive"][value="memories"]');
                            memoryTab?.click();
                          }}>
                            View All {memories.length} Memories
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                      <p>No memories yet</p>
                      <p className="text-sm mt-2">Add your first memory about {person.fullName}!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="memories" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-800">All Memories</h3>
                  <Button onClick={() => setShowAddMemory(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Memory
                  </Button>
                </div>
                
                {memoriesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : memories?.length > 0 ? (
                  <div className="space-y-4">
                    {memories.map((memory) => (
                      <MemoryCard key={memory.id} memory={memory} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                    <p>No memories yet</p>
                    <p className="text-sm mt-2">Capture your first memory about {person.fullName}!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-800">Events & Reminders</h3>
                  <Button onClick={() => setShowAddReminder(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reminder
                  </Button>
                </div>
                
                {remindersLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : reminders?.length > 0 ? (
                  <div className="space-y-4">
                    {reminders.map((reminder) => (
                      <ReminderCard key={reminder.id} reminder={reminder} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                    <p>No reminders yet</p>
                    <p className="text-sm mt-2">Set up reminders for important dates!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AddMemoryModal 
        open={showAddMemory} 
        onOpenChange={setShowAddMemory}
        defaultPersonId={person.id}
      />
      <AddReminderModal 
        open={showAddReminder} 
        onOpenChange={setShowAddReminder}
        defaultPersonId={person.id}
      />
      <EditPersonModal 
        open={showEditPerson} 
        onOpenChange={setShowEditPerson}
        person={person}
      />
    </div>
  );
}
