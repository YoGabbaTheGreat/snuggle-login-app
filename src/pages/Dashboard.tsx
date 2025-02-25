
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClickDialog } from "@/components/clicks/CreateClickDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import type { Click } from "@/types/click";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: clicks, isLoading } = useQuery({
    queryKey: ["clicks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clicks")
        .select("*")
        .eq('created_by', user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Click[];
    },
    enabled: !!user,
  });

  // If they're not logged in, redirect to auth
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // If no user, don't render anything
  if (!user) return null;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">
          Create or join Clicks to share photos with friends and family.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Only show create button if user is authenticated */}
        {user && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <CreateClickDialog />
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[160px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          clicks?.map((click) => (
            <Card
              key={click.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/clicks/${click.id}`)}
            >
              <CardHeader>
                <CardTitle>{click.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {click.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(click.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
