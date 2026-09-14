import { useState } from "react";
import type { DateRange, Matcher } from "react-day-picker";
import { CalendarDays, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { blockDatesByOwner } from "@/api/booking.api";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Booking } from "@/types/booking";
import axios from "axios";

type BookingFormForOwnerProps = {
  campgroundId: string;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  bookings: Booking[];
};

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const BookingFormForOwner = ({
  campgroundId,
  setBookings,
  bookings,
}: BookingFormForOwnerProps) => {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [isBlocking, setIsBlocking] = useState(false);
  const [error, setError] = useState("");

  const disabledBookingRanges: Matcher[] = bookings.map((booking) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);

    const lastOccupiedDay = new Date(checkOut);
    lastOccupiedDay.setDate(lastOccupiedDay.getDate() - 1);

    return {
      from: checkIn,
      to: lastOccupiedDay,
    };
  });

  const disabledDates: Matcher[] = [
    {
      before: new Date(),
    },
    ...disabledBookingRanges,
  ];

  const startDate = selectedRange?.from;
  const endDate = selectedRange?.to;

  const handleBlockDates = async () => {
    if (!startDate || !endDate || isBlocking) {
      return;
    }

    try {
      setIsBlocking(true);
      setError("");

      const data = await blockDatesByOwner(campgroundId, {
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
      });

      setBookings((prev) => [...prev, data.data]);

      toast.success("Dates blocked successfully");

      setSelectedRange(undefined);
    } catch (error) {
      console.error("Failed to block campground dates:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : "Something went wrong";

      setError(message);
      toast.error(message);
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <CalendarDays className="size-5 text-muted-foreground" />
          </div>

          <div>
            <CardTitle>Availability</CardTitle>

            <CardDescription className="mt-1">
              Block dates when your campground should not be available for
              guests.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
          <div className="border-r p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Start date
            </p>

            <p className="mt-1 text-sm font-medium">
              {startDate
                ? startDate.toLocaleDateString("pl-PL")
                : "Select date"}
            </p>
          </div>

          <div className="p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              End date
            </p>

            <p className="mt-1 text-sm font-medium">
              {endDate ? endDate.toLocaleDateString("pl-PL") : "Select date"}
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

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

          <p className="text-sm text-muted-foreground">
            Already booked or blocked dates cannot be selected. Guests will not
            be able to make reservations during the dates you block.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={!startDate || !endDate || isBlocking}
          onClick={handleBlockDates}
        >
          <LockKeyhole className="size-4" />

          {isBlocking ? "Blocking dates..." : "Block selected dates"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingFormForOwner;
