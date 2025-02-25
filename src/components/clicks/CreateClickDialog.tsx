
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { CreateClickInput, ClickFrequency } from "@/types/click";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const createClickSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().max(500).optional(),
  schedule_frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  schedule_day: z.number().min(1).max(31).optional(),
  schedule_time: z.string().optional(),
  members: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof createClickSchema>;

export function CreateClickDialog() {
  const [open, setOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Array<{ id: string; email: string }>>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(createClickSchema),
    defaultValues: {
      name: "",
      description: "",
      members: [],
    },
  });

  // Fetch available users to invite
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["available-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email:username")
        .neq("id", user?.id);

      if (error) throw error;
      return profiles;
    },
    enabled: open, // Only fetch when dialog is open
  });

  const onSubmit = async (data: FormData) => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a Click.",
      });
      return;
    }

    try {
      // Insert the Click
      const { data: click, error: clickError } = await supabase
        .from("clicks")
        .insert({
          name: data.name,
          description: data.description,
          schedule_frequency: data.schedule_frequency,
          schedule_day: data.schedule_day,
          schedule_time: data.schedule_time,
          created_by: user.id,
        })
        .select()
        .single();

      if (clickError) throw clickError;

      // Add the creator as an admin member
      const { error: creatorError } = await supabase
        .from("click_members")
        .insert({
          click_id: click.id,
          user_id: user.id,
          role: "admin",
        });

      if (creatorError) throw creatorError;

      // Add selected members
      if (selectedMembers.length > 0) {
        const { error: membersError } = await supabase
          .from("click_members")
          .insert(
            selectedMembers.map(member => ({
              click_id: click.id,
              user_id: member.id,
              role: "member",
            }))
          );

        if (membersError) throw membersError;
      }

      toast({
        title: "Click created!",
        description: "Your new Click has been created successfully.",
      });
      setOpen(false);
      setSelectedMembers([]);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error creating your Click.",
      });
    }
  };

  const removeSelectedMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== userId));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Click
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new Click</DialogTitle>
          <DialogDescription>
            Create a private group to share photos with friends and family.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Family Photos" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose a name for your Click group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's this Click about?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schedule_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posting Schedule</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How often should members post?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set how often members should post photos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Invite Members</FormLabel>
              <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {loadingUsers ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Select members to invite"
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users?.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            setSelectedMembers(prev => {
                              const exists = prev.find(member => member.id === user.id);
                              if (!exists) {
                                return [...prev, { id: user.id, email: user.email }];
                              }
                              return prev;
                            });
                            setCommandOpen(false);
                          }}
                        >
                          {user.email}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </DialogContent>
              </Dialog>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedMembers.map((member) => (
                  <Badge key={member.id} variant="secondary">
                    {member.email}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() => removeSelectedMember(member.id)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <FormDescription>
                Select users to invite to your Click
              </FormDescription>
            </FormItem>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setSelectedMembers([]);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Click</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
