import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/navigation";
import { AddReminderModal } from "@/components/add-reminder-modal";
import { ReminderCard } from "@/components/reminder-card";
import { SearchBar } from "@/components/search-bar";
import { Plus, Calendar, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function Timeline() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30"); // Default to next 30 days

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

  const { data: reminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['/api/reminders/upcoming', selectedTimeframe],
    queryFn: async () => {
      const days = selectedTimeframe === "all" ? 365 : parseInt(selectedTimeframe);
      const response = await fetch(`/api/reminders/upcoming?days=${days}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch reminders');
      }
      return response.json();
    },
  });

  const { data: people, isLoading: peopleLoading } = useQuery({
    queryKey: ['/api/people'],
    queryFn: async () => {
      const response = await fetch('/api/people');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch people');
      }
      return response.json();
    },
  });

  // Filter reminders based on search query and selected person
  const filteredReminders = reminders?.filter(reminder => {
    const matchesSearch = !searchQuery || 
      reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.person?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPerson = selectedPerson === "all" || 
      reminder.personId?.toString() === selectedPerson;
    
    return matchesSearch && matchesPerson;
  }) || [];

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

  // Sort reminders by reminder date (upcoming first)
  const sortedReminders = filteredReminders.sort((a, b) => {
    const dateA = new Date(a.reminderDate);
    const dateB = new Date(b.reminderDate);
    return dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Reminder Timeline</CardTitle>
                <p className="text-neutral-600 mt-1">
                  View all your upcoming reminders and important dates
                </p>
              </div>
              <Button onClick={() => setShowAddReminder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar 
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search reminders..."
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-48">
                    <select 
                      value={selectedPerson}
                      onChange={(e) => setSelectedPerson(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      disabled={peopleLoading}
                    >
                      <option value="all">All People</option>
                      {people?.map(person => (
                        <option key={person.id} value={person.id}>
                          {person.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:w-48">
                    <select 
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="7">Next 7 Days</option>
                      <option value="30">Next 30 Days</option>
                      <option value="90">Next 90 Days</option>
                      <option value="all">All Future</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {remindersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : sortedReminders.length > 0 ? (
                <div className="space-y-4">
                  {sortedReminders.map((reminder) => (
                    <ReminderCard key={reminder.id} reminder={reminder} />
                  ))}
                </div>
              ) : reminders?.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">No reminders yet</h3>
                  <p className="text-neutral-500 mb-4">
                    Set up reminders for birthdays, anniversaries, and other important dates
                  </p>
                  <Button onClick={() => setShowAddReminder(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Reminder
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">No matching reminders found</h3>
                  <p className="text-neutral-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddReminderModal 
        open={showAddReminder} 
        onOpenChange={setShowAddReminder}
      />
    </div>
  );
}
