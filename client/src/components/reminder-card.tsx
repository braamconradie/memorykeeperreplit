import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Phone, Bell, Edit, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ReminderCardProps {
  reminder: {
    id: number;
    type: string;
    title: string;
    description?: string;
    reminderDate: string;
    advanceDays?: number;
    isRecurring?: boolean;
    person?: {
      id: number;
      fullName: string;
      relationship: string;
    };
  };
  priority?: 'high' | 'medium' | 'low';
}

export function ReminderCard({ reminder, priority = 'medium' }: ReminderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      toast({
        title: "Reminder deleted",
        description: "The reminder has been successfully removed.",
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
        description: "Failed to delete reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getIcon = () => {
    switch (reminder.type) {
      case 'birthday':
        return <Gift className="h-5 w-5 text-white" />;
      case 'anniversary':
        return <Calendar className="h-5 w-5 text-white" />;
      case 'call':
        return <Phone className="h-5 w-5 text-white" />;
      default:
        return <Bell className="h-5 w-5 text-white" />;
    }
  };

  const getIconColor = () => {
    switch (reminder.type) {
      case 'birthday':
        return 'bg-secondary';
      case 'anniversary':
        return 'bg-primary';
      case 'call':
        return 'bg-accent';
      default:
        return 'bg-neutral-500';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'bg-secondary/10 border-secondary/20';
      case 'medium':
        return 'bg-neutral-50 border-neutral-200';
      case 'low':
        return 'bg-neutral-50 border-neutral-200';
      default:
        return 'bg-neutral-50 border-neutral-200';
    }
  };

  const getDaysUntil = () => {
    const today = new Date();
    // Parse reminder date as local date to avoid timezone issues
    const [year, month, day] = reminder.reminderDate.split('-').map(Number);
    const reminderDate = new Date(year, month - 1, day);
    const diffTime = reminderDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { text: "Today!", variant: "secondary" as const };
    } else if (diffDays === 1) {
      return { text: "Tomorrow", variant: "default" as const };
    } else if (diffDays > 0 && diffDays <= 7) {
      return { text: `${diffDays} days`, variant: "default" as const };
    } else if (diffDays > 7) {
      return { text: `${diffDays} days`, variant: "outline" as const };
    } else {
      return { text: "Past due", variant: "destructive" as const };
    }
  };

  const formatDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      deleteReminderMutation.mutate(reminder.id);
    }
  };

  const daysInfo = getDaysUntil();

  return (
    <Card className={`hover:shadow-md transition-shadow ${getPriorityColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`w-10 h-10 rounded-full ${getIconColor()} flex items-center justify-center`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-neutral-800">{reminder.title}</h3>
                <Badge variant={daysInfo.variant}>{daysInfo.text}</Badge>
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {reminder.description || formatDate(reminder.reminderDate)}
              </p>
              {reminder.person && (
                <p className="text-xs text-neutral-500 mt-1">
                  {reminder.person.fullName} • {reminder.person.relationship}
                </p>
              )}
              {reminder.advanceDays && reminder.advanceDays > 0 && (
                <p className="text-xs text-neutral-500 mt-1">
                  Remind me {reminder.advanceDays} days before
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDelete}
              disabled={deleteReminderMutation.isPending}
            >
              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
