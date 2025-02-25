
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem signing out.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Welcome back!</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600">
              Signed in as: {user?.email}
            </p>
            {/* Add your dashboard content here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
