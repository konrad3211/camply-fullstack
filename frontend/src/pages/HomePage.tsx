import { useEffect, useRef, useState, type SubmitEventHandler } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { CalendarDays, MapPin, Search, Star } from "lucide-react";
import { toast } from "sonner";

import { getCampgrounds } from "@/api/campground.api";
import type { Campground } from "@/types/campground";
import { useAuthStore } from "@/store/auth.store";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageLoader from "@/components/PageLoader";
import axios from "axios";

const HomePage = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    location: urlSearchParams.get("location") || "",
    checkIn: urlSearchParams.get("checkIn") || "",
    checkOut: urlSearchParams.get("checkOut") || "",
  });

  const [searchForm, setSearchForm] = useState({
    location: filters.location,
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
  });

  const [campgrounds, setCampgrounds] = useState<Campground[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  const currentUser = useAuthStore((state) => state.user);

  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state ?? {};

  const page = Math.max(Number(urlSearchParams.get("page")) || 1, 1);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const today = new Date();

  const todayFormatted = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const getNextDay = (date: string) => {
    if (!date) return todayFormatted;

    const nextDay = new Date(`${date}T00:00:00`);

    nextDay.setDate(nextDay.getDate() + 1);

    return `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(nextDay.getDate()).padStart(2, "0")}`;
  };

  const minimumCheckOutDate = searchForm.checkIn
    ? getNextDay(searchForm.checkIn)
    : todayFormatted;

  const isSearchUnchanged =
    searchForm.location === filters.location &&
    searchForm.checkIn === filters.checkIn &&
    searchForm.checkOut === filters.checkOut;

  const hasIncompleteDateRange =
    Boolean(searchForm.checkIn) !== Boolean(searchForm.checkOut);

  useEffect(() => {
    if (state?.action === "deleteCampground") {
      toast.success("Campground has been deleted successfully!");
    }

    if (state?.action === "updateCampground") {
      toast.warning("You are not the author");
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (state?.action === "refresh") {
      timeoutId = setTimeout(() => {
        const emptyFilters = {
          location: "",
          checkIn: "",
          checkOut: "",
        };

        setFilters(emptyFilters);
        setSearchForm(emptyFilters);

        setUrlSearchParams({});
      }, 0);
    }

    if (state.pathname) {
      navigate(state.pathname, {
        replace: true,
        state: null,
      });
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [state.action, state.pathname, navigate, setUrlSearchParams]);

  useEffect(() => {
    const fetchCampgrounds = async () => {
      try {
        setError("");

        const data = await getCampgrounds({
          location: filters.location,
          checkIn: filters.checkIn,
          checkOut: filters.checkOut,
          page,
          limit: 12,
        });

        setCampgrounds(data.data);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Failed to fetch campgrounds:", error);

        setError("Failed to fetch campgrounds");
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message
          : "Something went wrong";

        toast.warning(message);
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    };

    fetchCampgrounds();
  }, [filters.location, filters.checkIn, filters.checkOut, page]);

  const handleCheckInChange = (value: string) => {
    setSearchForm((prev) => {
      let checkOut = prev.checkOut;

      if (value && checkOut && checkOut <= value) {
        checkOut = "";
      }

      if (!value) {
        checkOut = "";
      }

      return {
        ...prev,
        checkIn: value,
        checkOut,
      };
    });
  };

  const handleSearch: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    if (isSearchUnchanged || hasIncompleteDateRange) {
      return;
    }

    setUrlSearchParams((prev) => {
      if (searchForm.location.trim()) {
        prev.set("location", searchForm.location.trim());
      } else {
        prev.delete("location");
      }

      if (searchForm.checkIn) {
        prev.set("checkIn", searchForm.checkIn);
      } else {
        prev.delete("checkIn");
      }

      if (searchForm.checkOut) {
        prev.set("checkOut", searchForm.checkOut);
      } else {
        prev.delete("checkOut");
      }

      prev.set("page", "1");

      return prev;
    });

    setIsSearching(true);

    setFilters({
      location: searchForm.location.trim(),
      checkIn: searchForm.checkIn,
      checkOut: searchForm.checkOut,
    });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <section>
      <div className="relative left-1/2 w-screen -translate-x-1/2 border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-14">
          {currentUser?.fullName ? (
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Where to next, {currentUser.fullName.split(" ")[0]}?
            </h1>
          ) : (
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Find your next campground
            </h1>
          )}

          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Discover unique places added by the Camply community and find your
            next stay.
          </p>
        </div>

        <div className="absolute bottom-0 left-1/2 w-full max-w-7xl translate-y-1/2 -translate-x-1/2 px-6">
          <form
            onSubmit={handleSearch}
            className="rounded-2xl border bg-background p-2 shadow-lg"
          >
            <div className="grid gap-1 md:grid-cols-[1.4fr_1fr_1fr_auto]">
              <div className="flex min-h-18 items-center gap-3 rounded-xl px-4 transition hover:bg-muted/40">
                <MapPin className="size-6 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="location"
                    className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Location
                  </label>

                  <input
                    id="location"
                    name="location"
                    value={searchForm.location}
                    placeholder="Where do you want to go?"
                    className="mt-1 w-full bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
                    onChange={(event) =>
                      setSearchForm((prev) => ({
                        ...prev,
                        location: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div
                onClick={() => checkInRef.current?.showPicker()}
                className="flex min-h-18 cursor-pointer items-center gap-3 rounded-xl border-t px-4 transition hover:bg-muted/40 md:border-l md:border-t-0"
              >
                <CalendarDays className="size-6 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="checkIn"
                    className="block cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Check in
                  </label>

                  <input
                    ref={checkInRef}
                    id="checkIn"
                    name="checkIn"
                    type="date"
                    value={searchForm.checkIn}
                    min={todayFormatted}
                    className="mt-1 w-full cursor-pointer bg-transparent text-sm font-medium outline-none [&::-webkit-calendar-picker-indicator]:hidden"
                    onChange={(event) =>
                      handleCheckInChange(event.target.value)
                    }
                  />
                </div>
              </div>

              <div
                onClick={() => {
                  if (!searchForm.checkIn) return;

                  checkOutRef.current?.showPicker();
                }}
                className={`flex min-h-18 items-center gap-3 rounded-xl border-t px-4 transition md:border-l md:border-t-0 ${
                  searchForm.checkIn
                    ? "cursor-pointer hover:bg-muted/40"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <CalendarDays className="size-6 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="checkOut"
                    className={`block text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
                      searchForm.checkIn
                        ? "cursor-pointer"
                        : "cursor-not-allowed"
                    }`}
                  >
                    Check out
                  </label>

                  <input
                    ref={checkOutRef}
                    id="checkOut"
                    name="checkOut"
                    type="date"
                    value={searchForm.checkOut}
                    min={minimumCheckOutDate}
                    disabled={!searchForm.checkIn}
                    className="mt-1 w-full cursor-pointer bg-transparent text-sm font-medium outline-none disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden"
                    onChange={(event) =>
                      setSearchForm((prev) => ({
                        ...prev,
                        checkOut: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  isSearching || isSearchUnchanged || hasIncompleteDateRange
                }
                className="min-h-14 rounded-xl px-7 md:min-h-18"
              >
                <Search className="size-5" />

                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-12 pt-20">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Find your next campground
          </h2>

          <p className="mt-2 text-muted-foreground">
            Discover places added by the Camply community.
          </p>
        </div>

        {isSearching ? (
          <p className="text-muted-foreground">Loading campgrounds...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : campgrounds.length === 0 ? (
          <div className="rounded-xl border bg-muted/20 p-10 text-center">
            <p className="font-medium">No campgrounds found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing the location or selected dates.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campgrounds.map((campground) => {
              const mainImage = campground.images[0];
              const averageRating = campground.averageRating ?? 0;
              const reviewsCount = campground.reviews?.length ?? 0;

              return (
                <Card
                  key={campground._id}
                  className="flex h-full flex-col overflow-hidden pt-0"
                >
                  {mainImage ? (
                    <img
                      src={mainImage.url}
                      alt={campground.title}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-muted">
                      <span className="text-sm text-muted-foreground">
                        No image
                      </span>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle>{campground.title}</CardTitle>

                    <p className="text-sm text-muted-foreground">
                      {campground.location}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`size-4 ${
                              star <= Math.round(averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>

                      {reviewsCount > 0 ? (
                        <span className="text-sm font-medium">
                          {averageRating.toFixed(1)}

                          <span className="ml-1 font-normal text-muted-foreground">
                            ({reviewsCount})
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No reviews
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <p className="line-clamp-3 text-sm">
                      {campground.description}
                    </p>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between">
                    <span className="font-semibold">
                      {campground.price} zł / night
                    </span>

                    <div className="flex gap-2">
                      <Button
                        render={<Link to={`/campgrounds/${campground._id}`} />}
                        nativeButton={false}
                      >
                        View
                      </Button>

                      {currentUser?._id === campground.author._id && (
                        <Button
                          variant="outline"
                          render={
                            <Link
                              to={`/campgrounds/${campground._id}/update`}
                            />
                          }
                          nativeButton={false}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => {
                setUrlSearchParams((prev) => {
                  prev.set("page", (page - 1).toString());

                  return prev;
                });
              }}
            >
              Previous
            </Button>

            {pages.map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={page === pageNumber ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  setUrlSearchParams((prev) => {
                    prev.set("page", pageNumber.toString());

                    return prev;
                  });
                }}
              >
                {pageNumber}
              </Button>
            ))}

            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => {
                setUrlSearchParams((prev) => {
                  prev.set("page", (page + 1).toString());

                  return prev;
                });
              }}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomePage;
