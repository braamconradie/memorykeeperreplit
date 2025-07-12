import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/navigation";
import { AddPersonModal } from "@/components/add-person-modal";
import { PersonCard } from "@/components/person-card";
import { SearchBar } from "@/components/search-bar";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function People() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("all");

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

  const { data: people, isLoading } = useQuery({
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

  // Filter people based on search query and relationship filter
  const filteredPeople = people?.filter(person => {
    const matchesSearch = !searchQuery || 
      person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.relationship.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRelationship = relationshipFilter === "all" || 
      person.relationship.toLowerCase().includes(relationshipFilter.toLowerCase());
    
    return matchesSearch && matchesRelationship;
  }) || [];

  // Get unique relationships for filter
  const relationships = [...new Set(people?.map(p => p.relationship) || [])];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Your People</CardTitle>
                <CardDescription>
                  Manage your relationships and keep track of important people in your life
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddPerson(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Person
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar 
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search people..."
                  />
                </div>
                <div className="sm:w-48">
                  <select 
                    value={relationshipFilter}
                    onChange={(e) => setRelationshipFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="all">All Relationships</option>
                    {relationships.map(relationship => (
                      <option key={relationship} value={relationship}>
                        {relationship}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* People Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : filteredPeople.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPeople.map((person) => (
                    <PersonCard key={person.id} person={person} />
                  ))}
                </div>
              ) : people?.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">No people yet</h3>
                  <p className="text-neutral-500 mb-4">
                    Add people to start building your relationship network
                  </p>
                  <Button onClick={() => setShowAddPerson(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Person
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">No matching people found</h3>
                  <p className="text-neutral-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddPersonModal 
        open={showAddPerson} 
        onOpenChange={setShowAddPerson}
      />
    </div>
  );
}
