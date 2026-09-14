import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DateRange, Matcher } from "react-day-picker";

import { createBooking, getCampgroundAvailability } from "@/api/booking.api";

import { useAuthStore } from "@/store/auth.store";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UnavailableBooking } from "@/types/booking";

type BookingFormProps = {
  campgroundId: string;
  pricePerNight: number;
};

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const BookingForm = ({ campgroundId, pricePerNight }: BookingFormProps) => {
  const navigate = useNavigate();

  const currentUser = useAuthStore((state) => state.user);

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  const [unavailableBookings, setUnavailableBookings] = useState<
    UnavailableBooking[]
  >([]);

  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoadingAvailability(true);
        setError("");

        const data = await getCampgroundAvailability(campgroundId);

        setUnavailableBookings(data.data);
      } catch (error) {
        console.error("Failed to fetch campground availability:", error);

        setError("Could not load available dates");
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [campgroundId]);

  const disabledBookingRanges: Matcher[] = unavailableBookings.map(
    (booking) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);

      const lastOccupiedDay = new Date(checkOut);

      lastOccupiedDay.setDate(lastOccupiedDay.getDate() - 1);

      return {
        from: checkIn,
        to: lastOccupiedDay,
      };
    },
  );

  const disabledDates: Matcher[] = [
    {
      before: new Date(),
    },
    ...disabledBookingRanges,
  ];

  const checkIn = selectedRange?.from;
  const checkOut = selectedRange?.to;

  const numberOfNights =
    checkIn && checkOut
      ? Math.round(
          (checkOut.getTime() - checkIn.getTime()) / MILLISECONDS_PER_DAY,
        )
      : 0;

  const totalPrice = numberOfNights * pricePerNight;

  const handleCreateBooking = async () => {
    if (!checkIn || !checkOut || numberOfNights < 1 || isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      setError("");

      if (!selectedRange?.from || !selectedRange?.to) {
        return;
      }

      const data = await createBooking(campgroundId, {
        checkIn: formatDateForApi(selectedRange.from),
        checkOut: formatDateForApi(selectedRange.to),
      });

      navigate(`/bookings/${data.data._id}/payment`, {
        state: {
          from: `/campgrounds/${campgroundId}`,
          action: "createBooking",
        },
      });
    } catch (error) {
      console.error("Failed to create booking:", error);

      setError("Selected dates are not available");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoadingAvailability) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-10">
          <p className="text-center text-sm text-muted-foreground">
            Loading available dates...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          {pricePerNight} zł
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / night
          </span>
        </CardTitle>

        <p className="text-sm text-muted-foreground">Select your stay dates</p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
          <div className="border-r p-3">
            <p className="text-xs font-semibold uppercase tracking-wide">
              Check-in
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {checkIn ? checkIn.toLocaleDateString("pl-PL") : "Add date"}
            </p>
          </div>

          <div className="p-3">
            <p className="text-xs font-semibold uppercase tracking-wide">
              Check-out
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {checkOut ? checkOut.toLocaleDateString("pl-PL") : "Add date"}
            </p>
          </div>
        </div>

        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={setSelectedRange}
          numberOfMonths={1}
          min={1}
          disabled={disabledDates}
          excludeDisabled
          className="relative w-full rounded-xl border p-3"
        />
        {checkIn && checkOut && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="underline underline-offset-4">
                {pricePerNight} zł × {numberOfNights}{" "}
                {numberOfNights === 1 ? "night" : "nights"}
              </span>

              <span>{totalPrice} zł</span>
            </div>

            <div className="flex items-center justify-between border-t pt-4 text-lg font-semibold">
              <span>Total</span>
              <span>{totalPrice} zł</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="button"
          size="lg"
          className="w-full text-base font-semibold"
          disabled={!checkIn || !checkOut || numberOfNights < 1 || isCreating}
          onClick={handleCreateBooking}
        >
          {isCreating
            ? "Creating booking..."
            : currentUser
              ? "Reserve"
              : "Log in to reserve"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You will not be charged yet
        </p>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
