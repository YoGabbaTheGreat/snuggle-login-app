
import { Chrome, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthPanel = () => {
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "An unexpected error occurred during sign in.",
      });
    }
  };

  return (
    <div className="glass-panel p-8 w-full max-w-md mx-auto animate-fade-in">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-600">Sign in to continue your journey</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignIn}
            className="auth-button bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          >
            <Chrome className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          <button className="auth-button bg-[#1877F2] text-white border-transparent hover:bg-[#1864D9]">
            <Facebook className="w-5 h-5" />
            <span>Continue with Facebook</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <form className="space-y-4">
          <div className="relative">
            <input
              type="email"
              id="email"
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary peer"
              placeholder=" "
            />
            <label htmlFor="email" className="floating-label peer-focus:text-primary">
              Email address
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              id="password"
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary peer"
              placeholder=" "
            />
            <label htmlFor="password" className="floating-label peer-focus:text-primary">
              Password
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPanel;
