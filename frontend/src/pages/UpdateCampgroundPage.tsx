import {
  deleteCampground,
  deleteCampgroundImage,
  getCampground,
  updateCampground,
  updateCampgroundImages,
} from "@/api/campground.api";
import {
  ImagePlus,
  MapPin,
  Pencil,
  Save,
  Trash2,
  Upload,
  CalendarDays,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  updateCampgroundSchema,
  updateImagesSchema,
  type UpdateCampgroundFormData,
  type UpdateImagesFormData,
} from "@/schemas/campground.schema";
import { useAuthStore } from "@/store/auth.store";
import type { Campground } from "@/types/campground";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";
import { deleteOwnerBooking, getOwnerBlockedDates } from "@/api/booking.api";
import BookingFormForOwner from "@/components/bookings/BookingFormForOwner";
import type { Booking } from "@/types/booking";
import ErrorState from "@/components/ErrorState";
import axios from "axios";

const UpdateCampgroundPage = () => {
  const { id } = useParams();

  const navigate = useNavigate();
  const currentUser = useAuthStore((store) => store.user);

  const [campground, setCampground] = useState<Campground | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [isCampgroundDeleting, setIsCampgroundDeleting] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(true);
  const [isBookingDeleting, setIsBookingDeleting] = useState(false);
  const [bookingDeletingError, setBookingDeletingError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateCampgroundFormData>({
    resolver: zodResolver(updateCampgroundSchema),
  });

  const {
    register: registerImages,
    handleSubmit: handleSubmitImages,
    watch,
    resetField,
    formState: { errors: imageErrors, isSubmitting: isImagesSubmitting },
  } = useForm<UpdateImagesFormData>({
    resolver: zodResolver(updateImagesSchema),
  });

  useEffect(() => {
    if (!id) {
      setFetchError("Campground id is missing");
      setIsBookingsLoading(false);
      return;
    }

    const fetchOwnerBookings = async () => {
      try {
        const bookings = await getOwnerBlockedDates(id);
        setBookings(bookings.data);
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setIsBookingsLoading(false);
      }
    };
    fetchOwnerBookings();
  }, [id, currentUser]);

  useEffect(() => {
    if (!id) {
      setFetchError("Campground id is missing");
      setIsLoading(false);
      return;
    }

    const fetchCampgroundData = async () => {
      try {
        setFetchError("");
        const data = await getCampground(id);
        setCampground(data.data);
      } catch (error) {
        console.error("Failed to fetch a campground:", error);
        setFetchError("Failed to fetch a campground");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampgroundData();
  }, [id, currentUser]);

  useEffect(() => {
    if (!campground) return;
    reset({
      title: campground.title,
      description: campground.description,
      street: campground.street,
      houseNumber: campground.houseNumber,
      city: campground.city,
      price: campground.price,
    });
  }, [campground, reset]);

  useEffect(() => {
    if (!campground) return;
  });

  if (!id) {
    return <Navigate to={"/"} replace />;
  }

  const selectedImages = watch("images");
  const selectedImagesCount = selectedImages?.length ?? 0;

  const handleUpdateCampground: SubmitHandler<
    UpdateCampgroundFormData
  > = async (data) => {
    try {
      setServerError("");
      await updateCampground(id, data);
      navigate(`/campgrounds/${id}`);
    } catch (error) {
      console.error("Failed to update a campground", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";
      setServerError(message);
    }
  };

  const handleUpdateCampgroundImages: SubmitHandler<
    UpdateImagesFormData
  > = async (image) => {
    try {
      const data = await updateCampgroundImages(id, image);
      resetField("images");
      setCampground((prevCampground) => {
        if (!prevCampground) return prevCampground;
        return {
          ...prevCampground,
          images: data.data.images,
        };
      });
      if (selectedImagesCount > 1) {
        return toast.success("Images uploaded successfully");
      }
      return toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Failed to update campground images");
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";

      toast.error(message);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      setIsImageDeleting(true);
      await deleteCampgroundImage(id, imageId);
      setCampground((prevCampground) => {
        if (!prevCampground) return prevCampground;
        return {
          ...prevCampground,
          images: prevCampground.images.filter((img) => img._id !== imageId),
        };
      });
    } catch (error) {
      console.error("Failed to delete an image", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";

      toast.error(message);
    } finally {
      setIsImageDeleting(false);
    }
  };

  const handleDeleteCampground = async (campgroundId: string) => {
    try {
      setIsCampgroundDeleting(true);
      await deleteCampground(campgroundId);
      navigate("/", {
        replace: true,
        state: {
          action: "deleteCampground",
        },
      });
    } catch (error) {
      console.error("Failed to delete a campground", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";

      toast.error(message);
      setIsCampgroundDeleting(false);
    }
  };

  const handleDeleteOwnerBooking = async (campgroundId: string) => {
    try {
      setIsBookingDeleting(true);
      await deleteOwnerBooking(campgroundId);
      setBookings((prevBookings) =>
        prevBookings.filter((booking) => booking._id !== campgroundId),
      );
    } catch (error) {
      console.error("Failed to delete an owner booking", error);
      setBookingDeletingError("Failed to delete an owner booking");
    } finally {
      setIsBookingDeleting(false);
    }
  };

  const availableImagesSlots = 8 - (campground?.images?.length ?? 0);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isCampgroundDeleting) {
    return <PageLoader />;
  }

  if (fetchError) {
    return <ErrorState message={fetchError} />;
  }

  if (!campground) {
    return <p>Campground not found</p>;
  }

  if (campground?.author._id !== currentUser?._id) {
    return (
      <Navigate
        to={"/"}
        replace
        state={{
          action: "updateCampground",
          from: `/campgrounds/${id}/update`,
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 pb-16 pt-10">
      {/* PAGE HEADER */}
      <div className="rounded-2xl border bg-muted/20 p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background shadow-sm">
            <Pencil className="size-5" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit campground
            </h1>

            <p className="mt-1 text-muted-foreground">
              Update your campground details, availability and photos.
            </p>
          </div>
        </div>
      </div>

      {/* CAMPGROUND DETAILS FORM */}
      <form
        className="space-y-6"
        onSubmit={handleSubmit(handleUpdateCampground)}
      >
        {/* BASIC INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle>Basic information</CardTitle>

            <CardDescription>
              Change the name and description of your campground.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>

              <input
                id="title"
                placeholder="Campground title"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("title")}
              />

              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>

              <textarea
                id="description"
                rows={6}
                placeholder="Describe your campground..."
                disabled={isSubmitting}
                className="w-full resize-none rounded-lg border bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("description")}
              />

              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LOCATION */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-muted-foreground" />
              <CardTitle>Location</CardTitle>
            </div>

            <CardDescription>
              Update the address used to locate your campground.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="street" className="text-sm font-medium">
                  Street
                </label>

                <input
                  id="street"
                  placeholder="Street"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("street")}
                />

                {errors.street && (
                  <p className="text-sm text-destructive">
                    {errors.street.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="houseNumber" className="text-sm font-medium">
                  House number
                </label>

                <input
                  id="houseNumber"
                  placeholder="House number"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("houseNumber")}
                />

                {errors.houseNumber && (
                  <p className="text-sm text-destructive">
                    {errors.houseNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>

              <input
                id="city"
                placeholder="City"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("city")}
              />

              {errors.city && (
                <p className="text-sm text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PRICE */}
        <Card>
          <CardHeader>
            <CardTitle>Price</CardTitle>

            <CardDescription>
              Set the price guests pay for one night.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="max-w-xs space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price per night
              </label>

              <div className="relative">
                <input
                  type="number"
                  id="price"
                  placeholder="0"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-lg border bg-background px-3 pr-16 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("price", {
                    valueAsNumber: true,
                  })}
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  zł
                </span>
              </div>

              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => navigate(`/campgrounds/${id}`)}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={isSubmitting || !isDirty}>
            <Save className="size-4" />

            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      {/* AVAILABILITY */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-muted-foreground" />

            <h2 className="text-xl font-semibold">Availability</h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage dates when your campground should not be available for
            guests.
          </p>
        </div>

        <BookingFormForOwner
          campgroundId={campground._id}
          setBookings={setBookings}
          bookings={bookings}
        />

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Blocked dates</CardTitle>

                <CardDescription className="mt-1">
                  Dates you have manually marked as unavailable.
                </CardDescription>
              </div>

              {!isBookingsLoading && bookings.length > 0 && (
                <span className="flex min-w-8 items-center justify-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {bookings.length}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {isBookingsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-10 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
                  <CalendarDays className="size-5 text-muted-foreground" />
                </div>

                <p className="mt-4 font-medium">No blocked dates</p>

                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  You haven't manually blocked any dates for this campground
                  yet.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                {bookings.map((booking, index) => {
                  const startDate = new Date(booking.checkIn);
                  const endDate = new Date(booking.checkOut);

                  const formattedStartDate = startDate.toLocaleDateString(
                    "pl-PL",
                    {
                      timeZone: "Europe/Warsaw",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  );

                  const formattedEndDate = endDate.toLocaleDateString("pl-PL", {
                    timeZone: "Europe/Warsaw",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={booking._id}
                      className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${
                        index !== bookings.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <CalendarDays className="size-4 text-muted-foreground" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            <span>{formattedStartDate}</span>

                            <span className="text-muted-foreground">→</span>

                            <span>{formattedEndDate}</span>
                          </div>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Blocked by you
                          </p>
                        </div>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isBookingDeleting}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            />
                          }
                        >
                          <X className="size-4" />
                          Remove block
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove blocked dates?
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                              {formattedStartDate} – {formattedEndDate} will
                              become available for guests to reserve again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isBookingDeleting}>
                              Cancel
                            </AlertDialogCancel>

                            <AlertDialogAction
                              disabled={isBookingDeleting}
                              onClick={() =>
                                handleDeleteOwnerBooking(booking._id)
                              }
                            >
                              {isBookingDeleting
                                ? "Removing..."
                                : "Remove block"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })}
              </div>
            )}

            {bookingDeletingError && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-sm text-destructive">
                  {bookingDeletingError}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PHOTOS */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ImagePlus className="size-5 text-muted-foreground" />
                <CardTitle>Photos</CardTitle>
              </div>

              <CardDescription className="mt-2">
                Manage photos shown on your campground page.
              </CardDescription>
            </div>

            <div className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
              {campground.images.length} / 8
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campground.images.map((img, index) => (
              <div
                key={img._id}
                className="group relative overflow-hidden rounded-xl border bg-muted"
              >
                <img
                  src={img.url.replace(
                    "/upload",
                    "/upload/w_600,h_400,c_fill,f_auto,q_auto/",
                  )}
                  alt={`${campground.title} ${index + 1}`}
                  className="aspect-3/2 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />

                {index === 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
                    Main photo
                  </span>
                )}

                <div className="absolute right-3 top-3">
                  {campground.images.length > 6 ? (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            disabled={
                              campground.images.length <= 6 || isImageDeleting
                            }
                            className="size-9 bg-white shadow-md hover:bg-white hover:opacity-70"
                          />
                        }
                      >
                        <Trash2 className="size-4" />
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this photo?
                          </AlertDialogTitle>

                          <AlertDialogDescription>
                            This image will be permanently removed from the
                            campground.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>

                          <AlertDialogAction
                            onClick={() => handleDeleteImage(img._id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() =>
                        toast.warning(
                          "You must keep at least 6 images. Upload another image before deleting this one.",
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {availableImagesSlots > 0 ? (
            <div className="border-t pt-6">
              <form
                className="space-y-4"
                onSubmit={handleSubmitImages(handleUpdateCampgroundImages)}
              >
                <div>
                  <label
                    htmlFor="images"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition hover:bg-muted/50"
                  >
                    <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
                      <Upload className="size-5 text-muted-foreground" />
                    </div>

                    <span className="font-medium">Add more photos</span>

                    <span className="mt-1 text-sm text-muted-foreground">
                      Click to select images
                    </span>

                    {selectedImagesCount > 0 && (
                      <span className="mt-3 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {selectedImagesCount}{" "}
                        {selectedImagesCount === 1
                          ? "photo selected"
                          : "photos selected"}
                      </span>
                    )}

                    <input
                      disabled={availableImagesSlots === 0}
                      id="images"
                      type="file"
                      multiple={availableImagesSlots > 1}
                      accept="image/*"
                      className="hidden"
                      {...registerImages("images", {
                        onChange: (event) => {
                          const files = event.target.files;

                          if (!files) return;

                          if (files.length > availableImagesSlots) {
                            toast.warning(
                              `You can select up to ${availableImagesSlots} more ${
                                availableImagesSlots === 1 ? "photo" : "photos"
                              }`,
                            );

                            event.target.value = "";
                          }
                        },
                      })}
                    />
                  </label>

                  {imageErrors.images && (
                    <p className="mt-2 text-sm text-destructive">
                      {imageErrors.images.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isImagesSubmitting || selectedImagesCount === 0}
                  >
                    <Upload className="size-4" />

                    {isImagesSubmitting ? "Uploading..." : "Upload photos"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border-t pt-6">
              <div className="rounded-xl bg-muted/50 px-4 py-6 text-center">
                <p className="font-medium">Maximum number of photos reached</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Delete a photo before uploading a new one.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DANGER ZONE */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>

          <CardDescription>
            Permanently delete this campground and its associated data. This
            action cannot be undone.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Delete campground</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Once deleted, this campground cannot be recovered.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isCampgroundDeleting}
                    className="shrink-0"
                  />
                }
              >
                <Trash2 className="size-4" />
                Delete campground
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {campground.title}?
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    This will permanently delete this campground and all of its
                    associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isCampgroundDeleting}>
                    Cancel
                  </AlertDialogCancel>

                  <AlertDialogAction
                    disabled={isCampgroundDeleting}
                    onClick={() => handleDeleteCampground(campground._id)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    <Trash2 className="size-4" />
                    {isCampgroundDeleting ? "Deleting..." : "Delete campground"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateCampgroundPage;
