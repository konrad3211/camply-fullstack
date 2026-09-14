import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../src/app.js";
import { Campground } from "../src/models/campground.model.js";

const registerUser = async ({ username, email }) => {
  return request(app).post("/api/auth/register").send({
    fullName: "Test User",
    username,
    email,
    password: "Password1!",
  });
};

const createTestCampground = async (authorId) => {
  return Campground.create({
    title: "Test Campground",
    description: "Test description",
    price: 100,
    city: "Glogow",
    street: "Testowa",
    houseNumber: "1",
    location: "Testowa 1, Glogow",
    formattedLocation: "Testowa 1, Glogow",
    geometry: {
      type: "Point",
      coordinates: [16.08, 51.66],
    },
    images: [
      { url: "test1.jpg", filename: "test1" },
      { url: "test2.jpg", filename: "test2" },
      { url: "test3.jpg", filename: "test3" },
      { url: "test4.jpg", filename: "test4" },
      { url: "test5.jpg", filename: "test5" },
      { url: "test6.jpg", filename: "test6" },
    ],
    author: authorId,
  });
};

const createBooking = async ({
  accessToken,
  campgroundId,
  checkIn = "2030-01-01",
  checkOut = "2030-01-10",
}) => {
  return request(app)
    .post(`/api/bookings/campgrounds/${campgroundId}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      checkIn,
      checkOut,
    });
};

const cancelBooking = async ({ accessToken, bookingId }) => {
  return request(app)
    .patch(`/api/bookings/${bookingId}/cancel`)
    .set("Authorization", `Bearer ${accessToken}`);
};

describe("Bookings", () => {
  it("Should return 401 when an unauthenticated user tries to create a reservation", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await request(app)
      .post(`/api/bookings/campgrounds/${campground._id}`)
      .send({
        checkIn: "2030-01-01",
        checkOut: "2030-01-10",
      });

    expect(response.status).toBe(401);
  });

  it("Should return 400 when owner tries to book own campground", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await createBooking({
      accessToken: ownerResponse.body.accessToken,
      campgroundId: campground._id,
    });

    expect(response.status).toBe(400);
  });

  it("Should return 201 when authenticated user creates a reservation", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guestuser",
      email: "guest@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await createBooking({
      accessToken: guestResponse.body.accessToken,
      campgroundId: campground._id,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("pending");
  });

  it("Should return 409 when booking dates conflict with an existing booking", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const firstGuestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const secondGuestResponse = await registerUser({
      username: "guest2",
      email: "guest2@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const firstBookingResponse = await createBooking({
      accessToken: firstGuestResponse.body.accessToken,
      campgroundId: campground._id,
      checkIn: "2030-01-01",
      checkOut: "2030-01-10",
    });

    expect(firstBookingResponse.status).toBe(201);

    const conflictingBookingResponse = await createBooking({
      accessToken: secondGuestResponse.body.accessToken,
      campgroundId: campground._id,
      checkIn: "2030-01-02",
      checkOut: "2030-01-05",
    });

    expect(conflictingBookingResponse.status).toBe(409);
  });

  it("Should return 200 when authenticated user cancels own booking", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const bookingResponse = await createBooking({
      accessToken: guestResponse.body.accessToken,
      campgroundId: campground._id,
    });

    expect(bookingResponse.status).toBe(201);

    const cancelBookingResponse = await cancelBooking({
      accessToken: guestResponse.body.accessToken,
      bookingId: bookingResponse.body.data._id,
    });

    expect(cancelBookingResponse.status).toBe(200);
    expect(cancelBookingResponse.body.success).toBe(true);
    expect(cancelBookingResponse.body.data.status).toBe("cancelled");
  });

  it("Should return 404 when user tries to cancel someone else's booking", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const otherUserResponse = await registerUser({
      username: "guest2",
      email: "guest2@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const bookingResponse = await createBooking({
      accessToken: guestResponse.body.accessToken,
      campgroundId: campground._id,
    });

    expect(bookingResponse.status).toBe(201);

    const response = await cancelBooking({
      accessToken: otherUserResponse.body.accessToken,
      bookingId: bookingResponse.body.data._id,
    });

    expect(response.status).toBe(404);
  });

  it("Should allow another user to book dates after previous booking is cancelled", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const firstGuestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const secondGuestResponse = await registerUser({
      username: "guest2",
      email: "guest2@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const firstBookingResponse = await createBooking({
      accessToken: firstGuestResponse.body.accessToken,
      campgroundId: campground._id,
    });

    expect(firstBookingResponse.status).toBe(201);

    const cancelBookingResponse = await cancelBooking({
      accessToken: firstGuestResponse.body.accessToken,
      bookingId: firstBookingResponse.body.data._id,
    });

    expect(cancelBookingResponse.status).toBe(200);

    const secondBookingResponse = await createBooking({
      accessToken: secondGuestResponse.body.accessToken,
      campgroundId: campground._id,
    });

    expect(secondBookingResponse.status).toBe(201);
  });
});
