import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { X, Plus, UserPlus } from "lucide-react";

const memorySchema = z.object({
  personId: z.number().min(1, "Please select a person"),
  content: z.string().min(1, "Memory content is required"),
  tags: z.array(z.string()).optional(),
});

const newPersonSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  relationship: z.string().min(1, "Relationship is required"),
});

type MemoryFormData = z.infer<typeof memorySchema>;
type NewPersonFormData = z.infer<typeof newPersonSchema>;

interface AddMemoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPersonId?: number;
}

export function AddMemoryModal({ open, onOpenChange, defaultPersonId }: AddMemoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [newPersonData, setNewPersonData] = useState({ fullName: "", relationship: "" });

  const form = useForm<MemoryFormData>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      personId: defaultPersonId || 0,
      content: "",
      tags: [],
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

  const createPersonMutation = useMutation({
    mutationFn: async (data: NewPersonFormData) => {
      const response = await apiRequest('POST', '/api/people', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  const createMemoryMutation = useMutation({
    mutationFn: async (data: MemoryFormData) => {
      const memoryData = {
        ...data,
        tags: tags.length > 0 ? tags : undefined,
      };
      await apiRequest('POST', '/api/memories', memoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Memory added",
        description: "Your memory has been successfully saved.",
      });
      onOpenChange(false);
      form.reset();
      setTags([]);
      setTagInput("");
      setShowNewPersonForm(false);
      setNewPersonData({ fullName: "", relationship: "" });
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
        description: "Failed to add memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const onSubmit = async (data: MemoryFormData) => {
    createMemoryMutation.mutate(data);
  };

  const handleCreateNewPerson = async () => {
    if (!newPersonData.fullName || !newPersonData.relationship) {
      toast({
        title: "Missing information",
        description: "Please fill in both name and relationship fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await createPersonMutation.mutateAsync(newPersonData);
      const newPerson = response;
      
      // Auto-select the newly created person
      form.setValue('personId', newPerson.id);
      setShowNewPersonForm(false);
      setNewPersonData({ fullName: "", relationship: "" });
      
      toast({
        title: "Person added",
        description: `${newPerson.fullName} has been added to your contacts.`,
      });
    } catch (error) {
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
        description: "Failed to add person. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Memory</DialogTitle>
          <DialogDescription>
            Capture a meaningful moment or note about someone you care about.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                    disabled={peopleLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a person" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {people?.map((person) => (
                        <SelectItem key={person.id} value={person.id.toString()}>
                          {person.fullName}
                        </SelectItem>
                      ))}
                      <Separator />
                      <div className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left"
                          onClick={() => setShowNewPersonForm(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add New Person
                        </Button>
                      </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memory</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What do you want to remember about this person?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Person Creation Form */}
            {showNewPersonForm && (
              <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Add New Person</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewPersonForm(false);
                      setNewPersonData({ fullName: "", relationship: "" });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPersonName" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="newPersonName"
                      placeholder="Enter full name"
                      value={newPersonData.fullName}
                      onChange={(e) => setNewPersonData({
                        ...newPersonData,
                        fullName: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPersonRelationship" className="text-sm font-medium">
                      Relationship
                    </Label>
                    <Input
                      id="newPersonRelationship"
                      placeholder="e.g., Friend, Family"
                      value={newPersonData.relationship}
                      onChange={(e) => setNewPersonData({
                        ...newPersonData,
                        relationship: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleCreateNewPerson}
                  disabled={createPersonMutation.isPending}
                  className="w-full"
                >
                  {createPersonMutation.isPending ? "Adding..." : "Add Person"}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <FormLabel>Tags (optional)</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tags (e.g., birthday, gift ideas, important)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                Press Enter or comma to add tags
              </FormDescription>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMemoryMutation.isPending}
              >
                {createMemoryMutation.isPending ? "Saving..." : "Save Memory"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
