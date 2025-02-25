
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Plus } from "lucide-react";
import type { CreateClickInput, ClickFrequency } from "@/types/click";
import { supabase } from "@/integrations/supabase/client";

const createClickSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().max(500).optional(),
  schedule_frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  schedule_day: z.number().min(1).max(31).optional(),
  schedule_time: z.string().optional(),
});

export function CreateClickDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<CreateClickInput>({
    resolver: zodResolver(createClickSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateClickInput) => {
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
        })
        .select()
        .single();

      if (clickError) throw clickError;

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from("click_members")
        .insert({
          click_id: click.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      toast({
        title: "Click created!",
        description: "Your new Click has been created successfully.",
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error creating your Click.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Click
        </Button>
      </DialogTrigger>
      <DialogContent>
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
