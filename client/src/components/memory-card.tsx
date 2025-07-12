import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Tag, Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface MemoryCardProps {
  memory: {
    id: number;
    content: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    person?: {
      id: number;
      fullName: string;
      relationship: string;
    };
  };
  compact?: boolean;
}

export function MemoryCard({ memory, compact = false }: MemoryCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMemoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/memories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      toast({
        title: "Memory deleted",
        description: "The memory has been successfully removed.",
      });
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
        description: "Failed to delete memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (days === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this memory?")) {
      deleteMemoryMutation.mutate(memory.id);
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${compact ? 'py-2' : ''}`}>
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            {memory.person && (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {getInitials(memory.person.fullName)}
                </span>
              </div>
            )}
            <div className="flex-1">
              {memory.person && (
                <h3 className="font-medium text-neutral-800">{memory.person.fullName}</h3>
              )}
              <p className="text-sm text-neutral-600">{formatDate(memory.createdAt)}</p>
            </div>
          </div>
          {!compact && (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDelete}
                disabled={deleteMemoryMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
              </Button>
            </div>
          )}
        </div>
        
        <div className={memory.person ? "ml-13" : ""}>
          <p className="text-neutral-700 mb-2">{memory.content}</p>
          {memory.tags && memory.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-500">
              {memory.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
