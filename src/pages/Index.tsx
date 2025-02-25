
import AuthPanel from "@/components/AuthPanel";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-auth-pattern flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">
            Welcome to Our App
          </h1>
          <p className="text-white/90 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Sign in to start your experience
          </p>
        </div>
        <AuthPanel />
      </div>
    </div>
  );
};

export default Index;
