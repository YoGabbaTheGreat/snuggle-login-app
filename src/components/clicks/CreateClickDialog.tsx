
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const createClickSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
});

type FormData = z.infer<typeof createClickSchema>;

export function CreateClickDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(createClickSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (!user) {
        throw new Error("You must be logged in to create a Click");
      }

      // Create the click
      const { data: newClick, error: clickError } = await supabase
        .from('clicks')
        .insert({
          name: data.name,
          created_by: user.id,
          description: "Click members" // Adding a default description
        })
        .select()
        .single();

      if (clickError) throw clickError;

      // Create the creator as an admin member
      const { error: memberError } = await supabase
        .from('click_members')
        .insert({
          click_id: newClick.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      // Invalidate the clicks query to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ["clicks", user.id] });

      toast({
        title: "Success",
        description: "Click created successfully!",
      });
      
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create click",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-[150px] flex flex-col items-center justify-center gap-4">
          <Plus className="w-8 h-8" />
          Create Click
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new Click</DialogTitle>
          <DialogDescription>
            Give your Click a name. You can customize other settings later.
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
                    <Input 
                      placeholder="e.g., Family Photos" 
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
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
