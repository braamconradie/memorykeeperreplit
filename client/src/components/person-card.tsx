import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar } from "lucide-react";
import { useLocation } from "wouter";

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatBirthDate = (dateString: string) => {
    const date = new Date(dateString);
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
    const reminderDate = new Date(nextReminder.reminderDate);
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

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setLocation(`/person/${person.id}`)}
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
  );
}
