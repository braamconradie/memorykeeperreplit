import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const editPersonSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  birthDay: z.number().min(1).max(31).optional(),
  birthMonth: z.number().min(1).max(12).optional(),
  birthYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If either day or month is provided, both must be provided
  if (data.birthDay !== undefined || data.birthMonth !== undefined) {
    return data.birthDay !== undefined && data.birthMonth !== undefined;
  }
  return true;
}, {
  message: "Both day and month are required for birthday",
  path: ["birthDay"],
});

type EditPersonFormData = z.infer<typeof editPersonSchema>;

interface EditPersonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: {
    id: number;
    fullName: string;
    relationship: string;
    birthDate?: string;
    birthYear?: number;
    notes?: string;
  };
}

export function EditPersonModal({ open, onOpenChange, person }: EditPersonModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse birth date for form defaults
  const parseBirthDate = (birthDate?: string) => {
    if (!birthDate) return { birthDay: undefined, birthMonth: undefined };
    const [year, month, day] = birthDate.split('-').map(Number);
    return { birthDay: day, birthMonth: month };
  };

  const { birthDay, birthMonth } = parseBirthDate(person.birthDate);

  const form = useForm<EditPersonFormData>({
    resolver: zodResolver(editPersonSchema),
    defaultValues: {
      fullName: person.fullName,
      relationship: person.relationship,
      birthDay: birthDay,
      birthMonth: birthMonth,
      birthYear: person.birthYear,
      notes: person.notes || "",
    },
  });

  const updatePersonMutation = useMutation({
    mutationFn: async (data: EditPersonFormData) => {
      const personData = {
        fullName: data.fullName,
        relationship: data.relationship,
        birthDate: data.birthDay && data.birthMonth ? 
          `${data.birthYear || 2000}-${data.birthMonth.toString().padStart(2, '0')}-${data.birthDay.toString().padStart(2, '0')}` : 
          undefined,
        birthYear: data.birthYear,
        notes: data.notes,
      };
      await apiRequest('PUT', `/api/people/${person.id}`, personData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      queryClient.invalidateQueries({ queryKey: ['/api/people', person.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Person updated",
        description: "The person's information has been successfully updated.",
      });
      onOpenChange(false);
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
        description: "Failed to update person. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditPersonFormData) => {
    updatePersonMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Person</DialogTitle>
          <DialogDescription>
            Update information about {person.fullName}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., friend, colleague, family member" {...field} />
                  </FormControl>
                  <FormDescription>
                    How do you know this person?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Birthday</FormLabel>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="birthDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            { value: 1, label: "January" },
                            { value: 2, label: "February" },
                            { value: 3, label: "March" },
                            { value: 4, label: "April" },
                            { value: 5, label: "May" },
                            { value: 6, label: "June" },
                            { value: 7, label: "July" },
                            { value: 8, label: "August" },
                            { value: 9, label: "September" },
                            { value: 10, label: "October" },
                            { value: 11, label: "November" },
                            { value: 12, label: "December" },
                          ].map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1990"
                          {...field}
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Day and month are required for birthday reminders. Year is optional and used to calculate age.
              </FormDescription>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Important details about this person (interests, preferences, etc.)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    These notes will appear in reminder emails
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updatePersonMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatePersonMutation.isPending}
              >
                {updatePersonMutation.isPending ? "Updating..." : "Update Person"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}