import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/navigation";
import { AddMemoryModal } from "@/components/add-memory-modal";
import { MemoryCard } from "@/components/memory-card";
import { SearchBar } from "@/components/search-bar";
import { Plus, Clock, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function Timeline() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");

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

  const { data: memories, isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories'],
    queryFn: async () => {
      const response = await fetch('/api/memories');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to fetch memories');
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

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/memories/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/memories/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error('Failed to search memories');
      }
      return response.json();
    },
    enabled: !!searchQuery.trim(),
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

  // Filter memories based on search query, person, and timeframe
  const filteredMemories = (() => {
    if (searchQuery.trim()) {
      return searchResults || [];
    }

    let filtered = memories || [];

    if (selectedPerson !== "all") {
      filtered = filtered.filter(memory => memory.person?.id === parseInt(selectedPerson));
    }

    if (selectedTimeframe !== "all") {
      const now = new Date();
      const timeframeDays = {
        'week': 7,
        'month': 30,
        'year': 365
      };
      
      const days = timeframeDays[selectedTimeframe];
      if (days) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(memory => new Date(memory.createdAt) >= cutoff);
      }
    }

    return filtered;
  })();

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Memory Timeline</CardTitle>
                <p className="text-neutral-600 mt-1">
                  Explore your memories chronologically and search for specific moments
                </p>
              </div>
              <Button onClick={() => setShowAddMemory(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Memory
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
                    placeholder="Search memories..."
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
                      <option value="all">All Time</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {memoriesLoading || searchLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredMemories.length > 0 ? (
                <div className="space-y-4">
                  {filteredMemories.map((memory) => (
                    <MemoryCard key={memory.id} memory={memory} />
                  ))}
                </div>
              ) : memories?.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">No memories yet</h3>
                  <p className="text-neutral-500 mb-4">
                    Start capturing meaningful moments with the people you care about
                  </p>
                  <Button onClick={() => setShowAddMemory(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Memory
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">No matching memories found</h3>
                  <p className="text-neutral-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddMemoryModal 
        open={showAddMemory} 
        onOpenChange={setShowAddMemory}
      />
    </div>
  );
}
