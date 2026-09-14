import {
  cancelUserBookingByOwner,
  getCampgroundBookings,
} from "@/api/booking.api";
import PageLoader from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Booking } from "@/types/booking";

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  LogIn,
  LogOut,
  MessageCircle,
  X,
} from "lucide-react";
import ErrorState from "@/components/ErrorState";
import type { User } from "@/types/user";

const CampgroundBookingsPage = () => {
  const { campgroundId } = useParams<{ campgroundId: string }>();

  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    from?: string;
  } | null;

  const [campgroundBookings, setCampgroundBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!campgroundId) return;

    const fetchCampgroundBookings = async () => {
      try {
        setError("");

        const data = await getCampgroundBookings(campgroundId);

        setCampgroundBookings(data.data);
      } catch (error) {
        console.error("Failed to fetch campground bookings", error);

        setError("Failed to fetch campground bookings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampgroundBookings();
  }, [campgroundId]);

  const cancelBooking = async (bookingId: string) => {
    try {
      setIsDeleting(true);
      await cancelUserBookingByOwner(bookingId);
      setCampgroundBookings((prevBookings) =>
        prevBookings.filter((booking) => booking._id !== bookingId),
      );
    } catch (error) {
      console.error("Failed to cancel a booking", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (campgroundBookings.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border bg-muted/20 px-6 py-14 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-background shadow-sm">
            <CalendarDays className="size-5 text-muted-foreground" />
          </div>

          <h2 className="mt-4 text-xl font-semibold">No bookings yet</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This campground does not have any guest reservations yet.
          </p>

          <Button
            variant="outline"
            className="mt-6"
            onClick={() => navigate(state?.from ?? "/")}
          >
            <ArrowLeft className="size-4" />
            Back to your campgrounds
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Campground bookings
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage guest reservations and contact people staying at your
            campground.
          </p>
        </div>

        <div className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
          {campgroundBookings.length}{" "}
          {campgroundBookings.length === 1 ? "booking" : "bookings"}
        </div>
      </div>

      <div className="space-y-4">
        {campgroundBookings.map((booking) => {
          const checkIn = new Date(booking.checkIn);
          const checkOut = new Date(booking.checkOut);

          const user = booking.user as User;

          const formattedCheckIn = checkIn.toLocaleDateString("pl-PL", {
            timeZone: "Europe/Warsaw",
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          const formattedCheckOut = checkOut.toLocaleDateString("pl-PL", {
            timeZone: "Europe/Warsaw",
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          return (
            <Card
              key={booking._id}
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <img
                      src={user.imageUrl}
                      alt={user.fullName}
                      className="size-14 shrink-0 rounded-full object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="font-semibold">{user.fullName}</h2>

                          {user.email && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          )}
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-muted/40 p-3">
                          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <LogIn className="size-3.5" />
                            Check-in
                          </div>

                          <p className="mt-1 text-sm font-medium">
                            {formattedCheckIn}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            15:00
                          </p>
                        </div>

                        <div className="rounded-xl bg-muted/40 p-3">
                          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <LogOut className="size-3.5" />
                            Check-out
                          </div>

                          <p className="mt-1 text-sm font-medium">
                            {formattedCheckOut}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            12:00
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 border-t bg-muted/10 p-5 lg:w-56 lg:border-l lg:border-t-0">
                    <Button
                      onClick={() =>
                        navigate("/conversations/new", {
                          state: {
                            action: "contactGuest",
                            campgroundId,
                            guest: booking.user,
                          },
                        })
                      }
                    >
                      <MessageCircle className="size-4" />
                      Send a message
                    </Button>

                    {(booking.status === "confirmed" ||
                      booking.status === "pending") && (
                      <Button
                        disabled={isDeleting}
                        onClick={() => cancelBooking(booking._id)}
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="size-4" />
                        Cancel booking
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default CampgroundBookingsPage;
