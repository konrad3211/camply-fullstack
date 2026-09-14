import { useAuthStore } from "@/store/auth.store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  updateProfileSchema,
  updateUserImageSchema,
  updateUserPasswordSchema,
  type UpdatePasswordFormData,
  type UpdateProfileFormData,
  type UpdateUserImageFormData,
} from "@/schemas/user.schema";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import {
  updatePassword,
  updateProfile,
  updateProfileImage,
} from "@/api/user.api";
import { toast } from "sonner";
import axios from "axios";

const UserProfilePage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(updateProfileSchema) });

  const {
    register: registerPassword,
    reset: resetPassword,
    handleSubmit: handlePasswordSubmit,
    formState: {
      errors: passwordErrors,
      isSubmitting: isPasswordSubmitting,
      dirtyFields: passwordDirtyFields,
    },
  } = useForm({
    resolver: zodResolver(updateUserPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const {
    register: registerImage,
    handleSubmit: handleImageSubmit,
    resetField,
    watch,
    formState: { errors: imageErrors, isSubmitting: isImageSubmitting },
  } = useForm<UpdateUserImageFormData>({
    resolver: zodResolver(updateUserImageSchema),
  });

  const selectedImage = watch("image");
  const selectedImageCount = selectedImage?.length ?? 0;

  useEffect(() => {
    if (!currentUser) return;
    reset({
      fullName: currentUser.fullName,
      email: currentUser.email,
    });
  }, [currentUser, reset]);

  const handleUpdateProfile: SubmitHandler<UpdateProfileFormData> = async (
    profileData,
  ) => {
    try {
      const data = await updateProfile(profileData);
      setUser(data.data);
      reset({
        fullName: data.data.fullName,
        email: data.data.email,
      });
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const handleUpdatePassword: SubmitHandler<UpdatePasswordFormData> = async (
    data,
  ) => {
    try {
      await updatePassword(data);
      toast.success("Password has been changed successfully!");
      resetPassword();
    } catch (error) {
      console.error("Failed to change a password", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";

      toast.error(message);
    }
  };

  const handleUpdateImage: SubmitHandler<UpdateUserImageFormData> = async (
    image,
  ) => {
    try {
      const data = await updateProfileImage(image);
      setUser(data.data);
      resetField("image");
      toast.success("An image has been changed successfully!");
    } catch (error) {
      console.error("Failed to change a profile image", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";
      toast.error(message);
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My profile</h1>

        <p className="mt-2 text-muted-foreground">
          Manage your personal information, profile photo and account security.
        </p>
      </div>

      {/* PROFILE PHOTO */}
      <Card>
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>

          <CardDescription>
            Update the photo displayed on your profile and across Camply.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={currentUser?.imageUrl}
              alt={currentUser?.username}
              className="size-24 shrink-0 rounded-full border object-cover shadow-sm"
            />

            <form
              onSubmit={handleImageSubmit(handleUpdateImage)}
              className="flex-1 space-y-4"
            >
              <div>
                <label
                  htmlFor="image"
                  className="mb-2 block text-sm font-medium"
                >
                  Choose a new photo
                </label>

                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  disabled={isImageSubmitting}
                  className="block w-full cursor-pointer rounded-lg border bg-background text-sm text-muted-foreground file:mr-4 file:border-0 file:bg-muted file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
                  {...registerImage("image")}
                />

                {imageErrors.image && (
                  <p className="mt-2 text-sm text-destructive">
                    {imageErrors.image.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  disabled={isImageSubmitting || selectedImageCount === 0}
                  type="submit"
                >
                  <Save className="size-4" />

                  {isImageSubmitting ? "Uploading..." : "Change photo"}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* PERSONAL INFORMATION */}
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>

          <CardDescription>Update your name and email address.</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-5"
            onSubmit={handleSubmit(handleUpdateProfile)}
          >
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </label>

              <input
                id="fullName"
                placeholder="Full name"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("fullName")}
              />

              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Email"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("email")}
              />

              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button disabled={isSubmitting || !isDirty} type="submit">
                <Save className="size-4" />

                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PASSWORD */}
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>

          <CardDescription>
            Enter your current password and choose a new one.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-5"
            onSubmit={handlePasswordSubmit(handleUpdatePassword)}
          >
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium">
                Current password
              </label>

              <input
                id="currentPassword"
                type="password"
                placeholder="Enter your current password"
                disabled={isPasswordSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...registerPassword("currentPassword")}
              />

              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New password
              </label>

              <input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                disabled={isPasswordSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...registerPassword("newPassword")}
              />

              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                disabled={
                  isPasswordSubmitting ||
                  !passwordDirtyFields.currentPassword ||
                  !passwordDirtyFields.newPassword
                }
                type="submit"
              >
                <Save className="size-4" />

                {isPasswordSubmitting ? "Saving..." : "Change password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default UserProfilePage;
