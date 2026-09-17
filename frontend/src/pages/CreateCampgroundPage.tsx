import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, MapPin, TentTree } from "lucide-react";

import { createCampground } from "@/api/campground.api";

import {
  createCampgroundSchema,
  type CreateCampgroundFormData,
} from "@/schemas/campground.schema";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";

const inputClassName =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50";

const labelClassName = "mb-2 block text-sm font-medium";

const CreateCampgroundPage = () => {
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCampgroundFormData>({
    resolver: zodResolver(createCampgroundSchema),
  });

  const selectedImages = watch("images");
  const selectedImagesCount = selectedImages?.length ?? 0;

  const handleCreateCampground: SubmitHandler<
    CreateCampgroundFormData
  > = async (data) => {
    try {
      setServerError("");

      const response = await createCampground(data);

      navigate(`/campgrounds/${response.data._id}`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";
      console.error(message);
      setServerError(message);
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6 lg:px-0">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <TentTree className="size-5" />

          <span className="text-sm font-medium">Host your campground</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Create a campground
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          Add the most important information, address, photos and price. You can
          update your campground later.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(handleCreateCampground)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Basic information</CardTitle>

            <CardDescription>
              Tell guests what makes your campground special.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label htmlFor="title" className={labelClassName}>
                Title
              </label>

              <input
                id="title"
                placeholder="e.g. Forest Camp by the lake"
                disabled={isSubmitting}
                className={inputClassName}
                {...register("title")}
              />

              {errors.title && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className={labelClassName}>
                Description
              </label>

              <textarea
                id="description"
                rows={7}
                placeholder="Describe the campground, surroundings, facilities and what guests can expect..."
                disabled={isSubmitting}
                className={`${inputClassName} resize-y`}
                {...register("description")}
              />

              <div className="mt-1 flex justify-between gap-4">
                {errors.description ? (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 characters.
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Max 2000 characters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <MapPin className="size-5" />
              </div>

              <div>
                <CardTitle>Location</CardTitle>

                <CardDescription className="mt-1">
                  We will use this address to automatically place the campground
                  on the map.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-[1fr_160px]">
              <div>
                <label htmlFor="street" className={labelClassName}>
                  Street
                </label>

                <input
                  id="street"
                  placeholder="e.g. Forest Street"
                  disabled={isSubmitting}
                  className={inputClassName}
                  {...register("street")}
                />

                {errors.street && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.street.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="houseNumber" className={labelClassName}>
                  House number
                </label>

                <input
                  id="houseNumber"
                  type="text"
                  placeholder="12A"
                  disabled={isSubmitting}
                  className={inputClassName}
                  {...register("houseNumber")}
                />

                {errors.houseNumber && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.houseNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="city" className={labelClassName}>
                City
              </label>

              <input
                id="city"
                type="text"
                placeholder="e.g. Głogów"
                disabled={isSubmitting}
                className={inputClassName}
                {...register("city")}
              />

              {errors.city && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <ImagePlus className="size-5" />
              </div>

              <div>
                <CardTitle>Photos</CardTitle>

                <CardDescription className="mt-1">
                  Upload 6–8 photos. The first photo will be used as the main
                  image.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <label
              htmlFor="images"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center transition-colors hover:bg-muted/40"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <ImagePlus className="size-6" />
              </div>

              <p className="font-medium">
                {selectedImagesCount > 0
                  ? `${selectedImagesCount} ${
                      selectedImagesCount === 1
                        ? "photo selected"
                        : "photos selected"
                    }`
                  : "Select campground photos"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                JPG, PNG, WEBP • max 5 MB per image
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Select between 6 and 8 images
              </p>

              <input
                id="images"
                type="file"
                multiple
                accept="image/*"
                disabled={isSubmitting}
                className="sr-only"
                {...register("images")}
              />
            </label>

            {errors.images && (
              <p className="mt-2 text-sm text-destructive">
                {errors.images.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price</CardTitle>

            <CardDescription>Set the price for one night.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="max-w-xs">
              <label htmlFor="price" className={labelClassName}>
                Price per night
              </label>

              <div className="relative">
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="150"
                  disabled={isSubmitting}
                  className={`${inputClassName} pr-20`}
                  {...register("price", {
                    valueAsNumber: true,
                  })}
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  zł / night
                </span>
              </div>

              {errors.price && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{serverError}</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="sm:min-w-44"
          >
            {isSubmitting ? "Creating..." : "Create campground"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default CreateCampgroundPage;
