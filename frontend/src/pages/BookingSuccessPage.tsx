import { getBooking } from "@/api/booking.api";
import ErrorState from "@/components/ErrorState";
import PageLoader from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking } from "@/types/booking";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

const BookingSuccessPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const location = useLocation();

  const locationState = location.state as {
    action?: "showConfirmation";
    from?: "/bookings";
  };

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      try {
        setError("");
        const data = await getBooking(bookingId);
        setBooking(data.data);
      } catch (error) {
        console.error("Failed to fetch booking:", error);
        setError("Failed to fetch booking");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (!bookingId) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!booking) {
    return <p className="text-center">Booking not found</p>;
  }

  if (booking.paymentStatus !== "paid" || booking.status !== "confirmed") {
    return <Navigate to={`/bookings/${booking._id}/payment`} replace />;
  }

  return (
    <section className="mx-auto max-w-xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
      {locationState?.action === "showConfirmation" && locationState?.from && (
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link to={locationState.from} />}
          className="w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          ← Back to bookings
        </Button>
      )}

      <Card>
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-9 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Booking confirmed</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your test payment was completed successfully.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border p-4">
            <p className="font-semibold">{booking.campground.title}</p>

            <p className="mt-1 text-sm text-muted-foreground">
              {booking.campground.location}
            </p>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
            <div className="border-r p-4">
              <p className="text-xs font-semibold uppercase tracking-wide">
                Check-in
              </p>

              <p className="mt-1">
                {new Date(booking.checkIn).toLocaleDateString("pl-PL")}
              </p>
            </div>

            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide">
                Check-out
              </p>

              <p className="mt-1">
                {new Date(booking.checkOut).toLocaleDateString("pl-PL")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>
                {booking.pricePerNight} zł × {booking.numberOfNights}{" "}
                {booking.numberOfNights === 1 ? "night" : "nights"}
              </span>

              <span>{booking.totalPrice} zł</span>
            </div>

            <div className="flex justify-between border-t pt-4 text-lg font-semibold">
              <span>Total paid</span>
              <span>{booking.totalPrice} zł</span>
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 p-4 text-sm">
            <p>
              Booking status: <span className="font-medium">Confirmed</span>
            </p>

            <p className="mt-1">
              Payment status: <span className="font-medium">Paid</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              onClick={() => navigate(`/campgrounds/${booking.campground._id}`)}
            >
              View campground
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/")}
            >
              Back to campgrounds
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default BookingSuccessPage;
