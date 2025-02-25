
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

const createClickSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
});

type FormData = z.infer<typeof createClickSchema>;

export function CreateClickDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(createClickSchema),
    defaultValues: {
      name: "",
    },
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
      console.log("Creating click with data:", { name: data.name, created_by: user.id });
      
      const { data: newClick, error: clickError } = await supabase
        .from("clicks")
        .insert([{  // Note: Wrapping the object in an array
          name: data.name,
          created_by: user.id,
          description: null,  // Explicitly set optional fields
          schedule_frequency: null,
          schedule_day: null,
          schedule_time: null,
        }])
        .select('*')
        .maybeSingle();

      if (clickError) {
        console.error("Error creating click:", clickError);
        throw clickError;
      }

      if (!newClick) {
        throw new Error("Failed to create click - no data returned");
      }

      console.log("Click created successfully:", newClick);

      // Now create the membership record
      const { error: memberError } = await supabase
        .from("click_members")
        .insert([{  // Note: Wrapping the object in an array
          click_id: newClick.id,
          user_id: user.id,
          role: "admin"
        }]);

      if (memberError) {
        console.error("Error creating membership:", memberError);
        toast({
          title: "Partial success",
          description: "Click was created but there was an error adding you as a member.",
        });
      } else {
        toast({
          title: "Success!",
          description: "Your new Click has been created.",
        });
      }

      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error in click creation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to create Click. Please try again.",
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
