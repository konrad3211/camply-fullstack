import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SubmitEventHandler,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { getCampground } from "@/api/campground.api";
import BookingForm from "@/components/bookings/BookingForm";
import {
  createReview,
  deleteReview,
  updateReview,
  getReviews,
} from "@/api/review.api";

import type { Campground, CampgroundReview } from "@/types/campground";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuthStore } from "@/store/auth.store";
import CampgroundMap from "@/components/CampgroundMap";
import type { Booking, userBooking } from "@/types/booking";
import { getUserBooking, getUserBookings } from "@/api/booking.api";
import PageLoader from "@/components/PageLoader";
import ErrorState from "@/components/ErrorState";

const REVIEWS_LIMIT = 10;

const CampgroundPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reviewsRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToReviews = useRef(false);

  const currentUser = useAuthStore((state) => state.user);

  const [campground, setCampground] = useState<Campground | null>(null);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(
    null,
  );

  const [reviews, setReviews] = useState<CampgroundReview[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [userBooking, setUserBooking] = useState<userBooking | null>(null);
  const [userBookingError, setUserBookingError] = useState("");

  const [editedReviewId, setEditedReviewId] = useState<string | null>(null);
  const [editedRating, setEditedRating] = useState<number | null>(null);
  const [editedReviewText, setEditedReviewText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isPostingReview, setIsPostingReview] = useState(false);
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);

  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [updateReviewError, setUpdateReviewError] = useState("");
  const [deleteReviewError, setDeleteReviewError] = useState("");

  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  const location = useLocation();

  useEffect(() => {
    if (!campground || !currentUser) return;
    const fetchUserBooking = async () => {
      try {
        const data = await getUserBookings();
        setUserBookings(data.data);
      } catch (error) {
        console.error("Failed to fetch user bookings", error);
      }
    };
    fetchUserBooking();
  }, [campground, currentUser]);

  useEffect(() => {
    if (!campground || !currentUser || !id) return;

    const canUserPostReview = async () => {
      try {
        setUserBookingError("");

        const data = await getUserBooking(id);
        setUserBooking(data.data);
      } catch (error) {
        console.error("Cannot check if user can post a review:", error);
        setUserBookingError("Could not check if you can post a review");
      }
    };

    canUserPostReview();
  }, [campground, currentUser, id]);

  useEffect(() => {
    if (!campground) return;
    switch (location.state?.action) {
      case "createReview": {
        document.querySelector("#reviews")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        break;
      }
    }
  }, [campground, location.state?.action]);

  useEffect(() => {
    const fetchCampground = async () => {
      if (!id) {
        setError("Campground id is missing");
        setIsLoading(false);
        return;
      }

      try {
        setError("");

        const data = await getCampground(id);

        setCampground(data.data);
      } catch (error) {
        console.error("Failed to fetch campground:", error);

        setError("Failed to fetch campground");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampground();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      try {
        setReviewsError("");
        setIsReviewsLoading(true);
        const data = await getReviews(id, reviewsPage, REVIEWS_LIMIT);
        setReviews(data.data.reviews);
        setTotalReviews(data.data.totalReviews);
        setTotalReviewPages(data.data.totalPages);
      } catch (error) {
        console.error("Failed to fetch campground reviews:", error);
        setReviewsError("Failed to fetch campground reviews");
      } finally {
        setIsReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id, reviewsPage]);

  const handleChangeReviewsPage = (page: number) => {
    shouldScrollToReviews.current = true;
    setReviewsPage(page);
  };

  useEffect(() => {
    if (isReviewsLoading || !shouldScrollToReviews.current) return;
    reviewsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    shouldScrollToReviews.current = false;
  }, [isReviewsLoading]);

  const handleCloseLightbox = () => {
    setLightboxImageIndex(null);
  };

  const handlePreviousImage = useCallback(() => {
    setLightboxImageIndex((previousIndex) => {
      if (previousIndex === null) return null;

      if (previousIndex === 0) {
        return (campground?.images.length ?? 1) - 1;
      }

      return previousIndex - 1;
    });
  }, [campground?.images.length]);

  const handleNextImage = useCallback(() => {
    setLightboxImageIndex((previousIndex) => {
      if (previousIndex === null) return null;

      const imagesLength = campground?.images.length ?? 0;

      if (previousIndex === imagesLength - 1) {
        return 0;
      }

      return previousIndex + 1;
    });
  }, [campground?.images.length]);

  useEffect(() => {
    if (lightboxImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseLightbox();
      }

      if (event.key === "ArrowLeft") {
        handlePreviousImage();
      }

      if (event.key === "ArrowRight") {
        handleNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxImageIndex, handlePreviousImage, handleNextImage]);

  const handleOpenLightbox = (imageIndex: number) => {
    setLightboxImageIndex(imageIndex);
  };

  const calculateAverageRating = (reviews: Campground["reviews"]) => {
    if (reviews.length === 0) {
      return 0;
    }

    const totalRating = reviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0,
    );

    return totalRating / reviews.length;
  };

  const handleCreateReview: SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !campground ||
      !currentUser ||
      rating === null ||
      !reviewText.trim() ||
      isPostingReview
    ) {
      return;
    }

    try {
      setIsPostingReview(true);
      setReviewError("");

      const data = await createReview(campground._id, {
        rating,
        text: reviewText.trim(),
      });

      if (reviewsPage === 1) {
        setReviews((previousReviews) =>
          [data.data, ...previousReviews].slice(0, REVIEWS_LIMIT),
        );
      } else {
        setReviewsPage(1);
      }

      setCampground((previousCampground) => {
        if (!previousCampground) {
          return previousCampground;
        }

        const updatedReviews = [...previousCampground.reviews, data.data];

        return {
          ...previousCampground,
          reviews: updatedReviews,
          averageRating: calculateAverageRating(updatedReviews),
        };
      });

      setTotalReviews((previousTotal) => previousTotal + 1);
      setRating(null);
      setReviewText("");
    } catch (error) {
      console.error("Failed to create a review:", error);

      setReviewError("Failed to create a review");
    } finally {
      setIsPostingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!campground || deletingReviewId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      setDeleteReviewError("");

      await deleteReview(campground._id, reviewId);

      setReviews((previousReviews) =>
        previousReviews.filter((review) => review._id !== reviewId),
      );

      setCampground((previousCampground) => {
        if (!previousCampground) {
          return previousCampground;
        }
        const updatedReviews = previousCampground.reviews.filter(
          (review) => review._id !== reviewId,
        );
        return {
          ...previousCampground,
          reviews: updatedReviews,
          averageRating: calculateAverageRating(updatedReviews),
        };
      });

      setTotalReviews((previousTotal) => Math.max(previousTotal - 1, 0));

      if (editedReviewId === reviewId) {
        setEditedReviewId(null);
        setEditedRating(null);
        setEditedReviewText("");
      }
    } catch (error) {
      console.error("Failed to delete a review:", error);

      setDeleteReviewError("Failed to delete the review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleStartEditing = (
    reviewId: string,
    reviewText: string,
    reviewRating: number,
  ) => {
    setEditedReviewId(reviewId);
    setEditedReviewText(reviewText);
    setEditedRating(reviewRating);

    setUpdateReviewError("");
    setDeleteReviewError("");
  };

  const handleCancelEditing = () => {
    setEditedReviewId(null);
    setEditedRating(null);
    setEditedReviewText("");
    setUpdateReviewError("");
  };

  const checkAvailability = () => {
    const element = document.querySelector("#calendar");
    if (!element) return;
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    element.classList.add(
      "rounded-xl",
      "shadow-[0_25px_70px_-20px_rgba(59,130,246,0.5)]",
      "duration-500",
    );
    setTimeout(() => {
      element.classList.remove(
        "rounded-xl",
        "shadow-[0_25px_70px_-20px_rgba(59,130,246,0.5)]",
      );
    }, 5000);
  };

  const handleUpdateReview: SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !campground ||
      !editedReviewId ||
      editedRating === null ||
      !editedReviewText.trim() ||
      isUpdatingReview
    ) {
      return;
    }

    const originalReview = reviews.find(
      (review) => review._id === editedReviewId,
    );

    if (!originalReview) {
      return;
    }

    const trimmedText = editedReviewText.trim();

    if (
      trimmedText === originalReview.text &&
      editedRating === originalReview.rating
    ) {
      handleCancelEditing();
      return;
    }

    try {
      setIsUpdatingReview(true);
      setUpdateReviewError("");

      const data = await updateReview(campground._id, editedReviewId, {
        rating: editedRating,
        text: trimmedText,
      });

      setReviews((previousReviews) => {
        const updatedReviews = previousReviews.map((review) =>
          review._id === editedReviewId
            ? {
                ...review,
                ...data.data,
              }
            : review,
        );
        return updatedReviews;
      });

      setCampground((previousCampground) => {
        if (!previousCampground) return previousCampground;
        const updateReview = previousCampground.reviews.map((review) =>
          review._id === editedReviewId
            ? {
                ...review,
                ...data.data,
              }
            : review,
        );
        return {
          ...previousCampground,
          reviews: updateReview,
          averageRating: calculateAverageRating(updateReview),
        };
      });

      setEditedReviewId(null);
      setEditedRating(null);
      setEditedReviewText("");
    } catch (error) {
      console.error("Failed to edit a review:", error);

      setUpdateReviewError("Failed to edit the review");
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleContactOwner = () => {
    if (!campground) {
      return;
    }

    if (currentUser?._id === campground.author._id) {
      return;
    }

    navigate(`/conversations/new`, {
      state: {
        campgroundId: campground._id,
        guest: currentUser,
      },
    });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!campground) {
    return <p>Campground not found.</p>;
  }

  const authorInitials = campground.author.fullName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const userClosestBooking = userBookings?.find(
    (booking: Booking) =>
      booking.campground._id === campground._id &&
      booking.status === "confirmed" &&
      booking.type === "booking",
  );

  const userClosestBookingDate = {
    checkIn: userClosestBooking ? new Date(userClosestBooking.checkIn) : null,
    checkOut: userClosestBooking ? new Date(userClosestBooking.checkOut) : null,
  };

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      {" "}
      <Button
        nativeButton={false}
        variant="ghost"
        className="w-fit gap-2 px-2 text-muted-foreground hover:text-foreground"
        render={
          location?.state?.from ? (
            <Link to={location.state.from} />
          ) : (
            <Link to="/" />
          )
        }
      >
        <ChevronLeft className="size-4" />
        Back to campgrounds
      </Button>
      {userClosestBookingDate.checkIn && userClosestBookingDate.checkOut && (
        <div className="rounded-2xl border bg-muted/20 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <CalendarDays className="size-5 text-primary" />
            </div>

            <div>
              <p className="font-semibold text-lg">Your upcoming stay</p>
              <p className="text-sm text-muted-foreground">
                Your reservation is confirmed
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-background p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Check-in
              </p>

              <p className="mt-2 text-xl font-semibold">
                {userClosestBookingDate.checkIn.toLocaleDateString("pl-PL", {
                  timeZone: "Europe/Warsaw",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">15:00</p>
            </div>

            <div className="rounded-xl border bg-background p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Check-out
              </p>

              <p className="mt-2 text-xl font-semibold">
                {userClosestBookingDate.checkOut.toLocaleDateString("pl-PL", {
                  timeZone: "Europe/Warsaw",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">12:00</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {campground.images.length > 0 ? (
            <div className="grid h-130 grid-cols-1 gap-2 overflow-hidden rounded-xl md:grid-cols-4 md:grid-rows-2">
              <button
                type="button"
                onClick={() => handleOpenLightbox(0)}
                className="group relative overflow-hidden md:col-span-2 md:row-span-2"
                aria-label="Open main image"
              >
                <img
                  src={campground.images[0].url}
                  alt={campground.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>

              {campground.images.slice(1, 4).map((image, index) => {
                const imageIndex = index + 1;

                return (
                  <button
                    key={image._id}
                    type="button"
                    onClick={() => handleOpenLightbox(imageIndex)}
                    className="group relative hidden overflow-hidden md:block"
                    aria-label={`Open image ${imageIndex + 1}`}
                  >
                    <img
                      src={image.url}
                      alt={`${campground.title} ${imageIndex + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                );
              })}

              {campground.images.length > 4 && (
                <button
                  type="button"
                  onClick={() => handleOpenLightbox(4)}
                  className="group relative hidden overflow-hidden md:block"
                  aria-label={`Open ${campground.images.length - 4} more photos`}
                >
                  <img
                    src={campground.images[4].url}
                    alt={`${campground.title} 5`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 transition-colors group-hover:bg-black/55">
                    <span className="text-lg font-semibold text-white">
                      +{campground.images.length - 4}{" "}
                      {campground.images.length - 4 === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-105 items-center justify-center rounded-xl bg-muted">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="leading-7">{campground.description}</p>
            </CardContent>
          </Card>
          {campground.geometry?.coordinates?.length === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p
                  title={campground.formattedLocation ?? campground.location}
                  className="text-muted-foreground"
                >
                  {campground.location}
                </p>

                <CampgroundMap
                  title={campground.title}
                  location={campground.location}
                  coordinates={campground.geometry.coordinates}
                />
              </CardContent>
            </Card>
          )}

          <div ref={reviewsRef} className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle id="reviews">Reviews</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {currentUser ? (
                  userBookingError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                      <p className="text-sm text-destructive">
                        {userBookingError}
                      </p>
                    </div>
                  ) : userBooking?.isPastBooking ? (
                    <form
                      onSubmit={handleCreateReview}
                      className="space-y-4 rounded-xl border bg-muted/20 p-4"
                    >
                      <div>
                        <p className="mb-2 text-sm font-medium">Your rating</p>

                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              disabled={isPostingReview}
                              className="rounded-md p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Rate ${star} out of 5`}
                            >
                              <Star
                                className={
                                  star <= (rating ?? 0)
                                    ? "size-7 fill-yellow-400 text-yellow-400"
                                    : "size-7 text-muted-foreground"
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="reviewText"
                          className="mb-2 block text-sm font-medium"
                        >
                          Your review
                        </label>

                        <textarea
                          id="reviewText"
                          value={reviewText}
                          onChange={(event) =>
                            setReviewText(event.target.value)
                          }
                          placeholder="Share your experience..."
                          disabled={isPostingReview}
                          className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        />
                      </div>

                      {reviewError && (
                        <p className="text-sm text-destructive">
                          {reviewError}
                        </p>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={
                            isPostingReview ||
                            rating === null ||
                            !reviewText.trim()
                          }
                        >
                          {isPostingReview ? "Posting..." : "Post review"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    campground.author._id !== currentUser._id && (
                      <div className="rounded-xl border bg-muted/20 p-4 ${currentUser?._id">
                        <p className="text-sm text-muted-foreground">
                          {userBooking
                            ? `You can post a review after your stay ${new Date(userBooking.checkOut).toLocaleDateString()}.`
                            : "You must book a stay first to review a campground."}
                        </p>

                        <Button
                          type="button"
                          variant="outline"
                          className={userBooking ? "hidden mt-3" : "mt-3"}
                          onClick={checkAvailability}
                        >
                          Check availability
                        </Button>
                      </div>
                    )
                  )
                ) : (
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">
                      Log in to add a review.
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      onClick={() =>
                        navigate("/login", {
                          state: {
                            action: "createReview",
                            campgroundId: campground._id,
                          },
                        })
                      }
                    >
                      Log in
                    </Button>
                  </div>
                )}

                {deleteReviewError && (
                  <p className="text-sm text-destructive">
                    {deleteReviewError}
                  </p>
                )}

                {isReviewsLoading ? (
                  <p className="text-muted-foreground">Loading reviews...</p>
                ) : reviewsError ? (
                  <p className="text-sm text-destructive">{reviewsError}</p>
                ) : reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) =>
                      editedReviewId === review._id ? (
                        <form
                          key={review._id}
                          onSubmit={handleUpdateReview}
                          className="space-y-4 rounded-xl border bg-muted/20 p-4"
                        >
                          <div>
                            <p className="mb-2 text-sm font-medium">Rating</p>

                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditedRating(star)}
                                  disabled={isUpdatingReview}
                                  className="rounded-md p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label={`Rate ${star} out of 5`}
                                >
                                  <Star
                                    className={
                                      star <= (editedRating ?? 0)
                                        ? "size-7 fill-yellow-400 text-yellow-400"
                                        : "size-7 text-muted-foreground"
                                    }
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-text-${review._id}`}
                              className="mb-2 block text-sm font-medium"
                            >
                              Review
                            </label>

                            <textarea
                              id={`edit-text-${review._id}`}
                              value={editedReviewText}
                              onChange={(event) =>
                                setEditedReviewText(event.target.value)
                              }
                              disabled={isUpdatingReview}
                              className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              required
                            />
                          </div>

                          {updateReviewError && (
                            <p className="text-sm text-destructive">
                              {updateReviewError}
                            </p>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isUpdatingReview}
                              onClick={handleCancelEditing}
                            >
                              Cancel
                            </Button>

                            <Button
                              type="submit"
                              disabled={
                                isUpdatingReview ||
                                editedRating === null ||
                                !editedReviewText.trim()
                              }
                            >
                              {isUpdatingReview ? "Saving..." : "Save changes"}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <article
                          key={review._id}
                          className="rounded-xl border p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">
                                {review.author.username}
                              </p>

                              <div
                                className="mt-1 flex"
                                aria-label={`${review.rating} out of 5 stars`}
                              >
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={
                                      star <= review.rating
                                        ? "size-4 fill-yellow-400 text-yellow-400"
                                        : "size-4 text-muted-foreground"
                                    }
                                  />
                                ))}
                              </div>
                            </div>

                            {review.author._id === currentUser?._id && (
                              <div className="flex items-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleStartEditing(
                                      review._id,
                                      review.text,
                                      review.rating,
                                    )
                                  }
                                  aria-label="Edit review"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="size-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteReview(review._id)}
                                  disabled={deletingReviewId === review._id}
                                  aria-label="Delete review"
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <p>{review.text}</p>

                          <small className="mt-2 block text-muted-foreground">
                            {new Date(
                              review.updatedAt ?? review.createdAt,
                            ).toLocaleString()}
                          </small>
                        </article>
                      ),
                    )}

                    {totalReviewPages > 1 && (
                      <div className="flex items-center justify-between border-t pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={reviewsPage === 1 || isReviewsLoading}
                          onClick={() =>
                            handleChangeReviewsPage(reviewsPage - 1)
                          }
                        >
                          Previous
                        </Button>

                        <span className="text-sm text-muted-foreground">
                          Page {reviewsPage} of {totalReviewPages}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            reviewsPage === totalReviewPages || isReviewsLoading
                          }
                          onClick={() =>
                            handleChangeReviewsPage(reviewsPage + 1)
                          }
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{campground.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p
                title={campground.formattedLocation ?? campground.location}
                className="text-muted-foreground"
              >
                {campground.location}
              </p>

              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={campground.author.imageUrl}
                    alt={campground.author.username}
                  />

                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>

                <Link
                  to={`/campgrounds/user/${campground.author._id}`}
                  state={{ action: "userCampgrounds", from: location.pathname }}
                >
                  <div>
                    <p className="font-medium">{campground.author.fullName}</p>

                    <p className="text-sm text-muted-foreground">
                      @{campground.author.username}
                    </p>
                  </div>
                </Link>
              </div>

              {currentUser?._id !== campground.author._id && (
                <Button className="w-full" onClick={handleContactOwner}>
                  Contact owner
                </Button>
              )}

              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={
                        star <= Math.round(campground.averageRating ?? 0)
                          ? "size-4 fill-yellow-400 text-yellow-400"
                          : "size-4 text-muted-foreground"
                      }
                    />
                  ))}
                </div>

                <span className="text-sm">
                  {(campground.averageRating ?? 0).toFixed(1)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </CardContent>
          </Card>

          {currentUser?._id !== campground.author._id && (
            <div id="calendar" className="scroll-mt-24">
              <BookingForm
                campgroundId={campground._id}
                pricePerNight={campground.price}
              />
            </div>
          )}
        </aside>
      </div>
      {lightboxImageIndex !== null && (
        <div
          className="fixed inset-0 z-999999999 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
          onClick={handleCloseLightbox}
        >
          <button
            type="button"
            onClick={handleCloseLightbox}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Close gallery"
          >
            <X className="size-7" />
          </button>

          {campground.images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handlePreviousImage();
              }}
              className="absolute left-4 z-10 rounded-full p-2 text-white transition-colors hover:bg-white/10"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-9" />
            </button>
          )}

          <img
            src={campground.images[lightboxImageIndex].url}
            alt={`${campground.title} ${lightboxImageIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          {campground.images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 z-10 rounded-full p-2 text-white transition-colors hover:bg-white/10"
              aria-label="Next image"
            >
              <ChevronRight className="size-9" />
            </button>
          )}

          <span className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {lightboxImageIndex + 1} / {campground.images.length}
          </span>
        </div>
      )}
    </section>
  );
};

export default CampgroundPage;
