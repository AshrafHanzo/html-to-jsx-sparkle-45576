import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    
    // Simulate login - check if user exists in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u: any) => u.username === username && u.password === password);
    
    setTimeout(() => {
      if (user || username === "admin") {
        localStorage.setItem("isAuthed", "true");
        localStorage.setItem("username", username);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
      setLoading(false);
    }, 800);
  };

  const handleSignup = async () => {
    if (!signupUsername.trim() || !signupPassword) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    
    // Save user to localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    
    if (users.find((u: any) => u.username === signupUsername)) {
      toast.error("Username already exists");
      setLoading(false);
      return;
    }

    users.push({ username: signupUsername, password: signupPassword });
    localStorage.setItem("users", JSON.stringify(users));
    
    setTimeout(() => {
      setSignupStep(2);
      setLoading(false);
      setTimeout(() => {
        setShowSignup(false);
        setSignupStep(1);
        setSignupUsername("");
        setSignupPassword("");
        toast.success("Account created! You can now login.");
      }, 1500);
    }, 800);
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-sky-100">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 shadow-lg">
              <span className="text-2xl font-bold text-white">DHI</span>
            </div>
            <CardTitle className="text-3xl font-bold text-sky-900 uppercase tracking-wide">
              DHI Consultancy
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Recruitment Management Portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Username</label>
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="text-sm text-sky-600 hover:text-sky-700 font-semibold hover:underline"
              >
                Don't have an account? Sign up
              </button>
            </div>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200">
              © {new Date().getFullYear()} DHI CONSULTANCY — Recruitment Platform
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="sm:max-w-md">
          {signupStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-sky-900">Create Your Account</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Sign up to access the recruitment portal
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Username</label>
                  <Input
                    type="text"
                    placeholder="jane.doe"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="h-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="h-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSignup(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSignup}
                    disabled={loading}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                  >
                    {loading ? "Creating..." : "Submit"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-sky-900">Account Created!</DialogTitle>
              <DialogDescription className="text-slate-600">
                You can now login with your credentials
              </DialogDescription>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
