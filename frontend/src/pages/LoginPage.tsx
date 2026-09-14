import { useState, type SubmitEventHandler } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { login } from "../api/auth.api";
import { Button } from "@/components/ui/button";
import axios from "axios";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = location.state as {
    from?: string;
  } | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      await login({
        email,
        password,
      });

      navigate(locationState?.from ?? "/", {
        replace: true,
      });
    } catch (error) {
      console.error("Login flow failed:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Log in to continue to Camply.
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />

            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              New to Camply?
            </span>

            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/register")}
          >
            Create an account
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Discover and book campgrounds added by the Camply community.
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
