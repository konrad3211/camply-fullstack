import {
  registerSchema,
  type RegisterUserFormData,
} from "@/schemas/auth.schema";
import { register } from "../api/auth.api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import axios from "axios";

const RegisterPage = () => {
  const navigate = useNavigate();
  const {
    register: registerUser,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const handleRegisterUser: SubmitHandler<RegisterUserFormData> = async (
    registerData,
  ) => {
    try {
      await register(registerData);
      toast.success("You have been successfully registered!");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Failed to register user", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";
      toast.error(message);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Join Camply and start discovering great campgrounds.
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <form
            onSubmit={handleSubmit(handleRegisterUser)}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...registerUser("fullName")}
              />

              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>

              <input
                id="username"
                type="text"
                placeholder="johndoe"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...registerUser("username")}
              />

              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...registerUser("email")}
              />

              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Create a password"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...registerUser("password")}
              />

              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={
                isSubmitting ||
                !dirtyFields.fullName ||
                !dirtyFields.username ||
                !dirtyFields.email ||
                !dirtyFields.password
              }
            >
              <UserPlus className="size-4" />

              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />

            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Already have an account?
            </span>

            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Log in
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
