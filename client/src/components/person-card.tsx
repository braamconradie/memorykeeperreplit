import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditPersonModal } from "./edit-person-modal";

interface PersonCardProps {
  person: {
    id: number;
    fullName: string;
    relationship: string;
    birthDate?: string;
    birthYear?: number;
    memoryCount: number;
    reminderCount: number;
    upcomingReminders: Array<{
      id: number;
      reminderDate: string;
      type: string;
      title: string;
    }>;
  };
}

export function PersonCard({ person }: PersonCardProps) {
  const [, setLocation] = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatBirthDate = (dateString: string) => {
    // Parse the date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  };

  const getUpcomingReminderInfo = () => {
    if (!person.upcomingReminders || person.upcomingReminders.length === 0) {
      return null;
    }

    const nextReminder = person.upcomingReminders[0];
    const today = new Date();
    // Parse reminder date as local date to avoid timezone issues
    const [year, month, day] = nextReminder.reminderDate.split('-').map(Number);
    const reminderDate = new Date(year, month - 1, day);
    const diffTime = reminderDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: "Today!", variant: "secondary" as const };
    } else if (diffDays === 1) {
      return { text: "Tomorrow", variant: "default" as const };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, variant: "default" as const };
    } else {
      return { text: `${diffDays} days`, variant: "outline" as const };
    }
  };

  const upcomingInfo = getUpcomingReminderInfo();

  const deletePersonMutation = useMutation({
    mutationFn: async (personId: number) => {
      const response = await fetch(`/api/people/${personId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete person');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Person deleted",
        description: `${person.fullName} has been removed from your contacts.`,
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete person. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown menu
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) {
      return;
    }
    setLocation(`/person/${person.id}`);
  };

  const handleDelete = () => {
    deletePersonMutation.mutate(person.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-medium">{getInitials(person.fullName)}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-neutral-800">{person.fullName}</h3>
              <p className="text-sm text-neutral-600">{person.relationship}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-dropdown-trigger>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-600">
              {person.birthDate 
                ? `Birthday: ${formatBirthDate(person.birthDate)}`
                : "No birthday set"
              }
            </span>
            {upcomingInfo && (
              <Badge variant={upcomingInfo.variant}>
                {upcomingInfo.text}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-sm text-neutral-600">
            <Heart className="h-4 w-4 mr-1" />
            <span>{person.memoryCount} memories</span>
            {person.reminderCount > 0 && (
              <>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4 mr-1" />
                <span>{person.reminderCount} reminders</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {showEditModal && (
        <EditPersonModal 
          open={showEditModal} 
          onOpenChange={setShowEditModal}
          person={person}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Person</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {person.fullName}? This will permanently remove them and all their associated memories and reminders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePersonMutation.isPending}
            >
              {deletePersonMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
