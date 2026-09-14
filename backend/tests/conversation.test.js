import { describe, it, expect, beforeEach, vi } from "vitest";
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

const fetchConversations = async (accessToken) => {
  return request(app)
    .get(`/api/conversations`)
    .set("Authorization", `Bearer ${accessToken}`);
};

const createConversation = async ({ accessToken, campgroundId }) => {
  return request(app)
    .post(`/api/conversations/start/${campgroundId}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      text: "Hi there",
    });
};

const createConversationWithGuest = async ({
  accessToken,
  campgroundId,
  guestId,
}) => {
  return request(app)
    .post(`/api/conversations/start/${campgroundId}/${guestId}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      text: "Hi there",
    });
};

const sendMessage = async ({ accessToken, conversationId }) => {
  return request(app)
    .post(`/api/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      text: "Hi there",
    });
};

const fetchConversation = async ({ accessToken, conversationId }) => {
  return request(app)
    .get(`/api/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${accessToken}`);
};

beforeEach(() => {
  app.set("io", {
    to: vi.fn(() => ({
      emit: vi.fn(),
    })),
  });
});

describe("Conversations", () => {
  it("Should return 401 when an unauthenticated user tries to fetch conversations", async () => {
    const response = await fetchConversations();
    expect(response.status).toBe(401);
  });

  it("Should return 201 when a user starts a conversation with a campground owner", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await createConversation({
      campgroundId: campground._id,
      accessToken: guestResponse.body.accessToken,
    });
    expect(response.status).toBe(201);
    expect(response.body.data.message.text).toBe("Hi there");
  });

  it("Should return 400 when a campground owner starts a conversation with himself", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await createConversation({
      campgroundId: campground._id,
      accessToken: ownerResponse.body.accessToken,
    });

    expect(response.status).toBe(400);
  });

  it("Should return 403 when a campground owner wants to start a conversation with guest who does not have a booking", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await createConversationWithGuest({
      campgroundId: campground._id,
      guestId: guestResponse.body.data._id,
      accessToken: ownerResponse.body.accessToken,
    });

    expect(response.status).toBe(403);
  });

  it("Should allow a campground owner to create a conversation with a guest who has a booking", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);
    const booking = await createBooking({
      campgroundId: campground._id,
      accessToken: guestResponse.body.accessToken,
    });
    expect(booking.status).toBe(201);
    const response = await createConversationWithGuest({
      campgroundId: campground._id,
      guestId: guestResponse.body.data._id,
      accessToken: ownerResponse.body.accessToken,
    });

    expect(response.status).toBe(201);
  });

  it("Should allow a conversation participant to send a message", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);
    const booking = await createBooking({
      campgroundId: campground._id,
      accessToken: guestResponse.body.accessToken,
    });
    expect(booking.status).toBe(201);

    const createConversationResponse = await createConversationWithGuest({
      campgroundId: campground._id,
      guestId: guestResponse.body.data._id,
      accessToken: ownerResponse.body.accessToken,
    });
    expect(createConversationResponse.status).toBe(201);

    const response = await sendMessage({
      conversationId: createConversationResponse.body.data.conversation._id,
      accessToken: guestResponse.body.accessToken,
    });
    expect(response.status).toBe(201);
    expect(response.body.data.text).toBe("Hi there");
  });

  it("Should return 403 when a user wants to fetch messages from a conversation that he does not belong", async () => {
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
    const booking = await createBooking({
      campgroundId: campground._id,
      accessToken: firstGuestResponse.body.accessToken,
    });
    expect(booking.status).toBe(201);
    const createConversationResponse = await createConversationWithGuest({
      campgroundId: campground._id,
      guestId: firstGuestResponse.body.data._id,
      accessToken: ownerResponse.body.accessToken,
    });
    expect(createConversationResponse.status).toBe(201);

    const response = await fetchConversation({
      accessToken: secondGuestResponse.body.accessToken,
      conversationId: createConversationResponse.body.data.conversation._id,
    });
    expect(response.status).toBe(403);
  });

  it("Should allow a conversation participant to fetch messages", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);
    const booking = await createBooking({
      campgroundId: campground._id,
      accessToken: guestResponse.body.accessToken,
    });
    expect(booking.status).toBe(201);
    const createConversationResponse = await createConversationWithGuest({
      campgroundId: campground._id,
      guestId: guestResponse.body.data._id,
      accessToken: ownerResponse.body.accessToken,
    });
    expect(createConversationResponse.status).toBe(201);

    const response = await fetchConversation({
      accessToken: guestResponse.body.accessToken,
      conversationId: createConversationResponse.body.data.conversation._id,
    });
    expect(response.status).toBe(200);
    expect(response.body.messages.length).toBeGreaterThan(0);
    expect(response.body.messages[0].text).toBe("Hi there");
  });

  it("Should mark a message as read", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);
    const booking = await createBooking({
      campgroundId: campground._id,
      accessToken: guestResponse.body.accessToken,
    });
    expect(booking.status).toBe(201);
    const createConversationResponse = await createConversationWithGuest({
      campgroundId: campground._id,
      guestId: guestResponse.body.data._id,
      accessToken: ownerResponse.body.accessToken,
    });
    expect(createConversationResponse.status).toBe(201);

    const response = await request(app)
      .patch(
        `/api/conversations/${createConversationResponse.body.data.conversation._id}/messages/read`,
      )
      .set("Authorization", `Bearer ${guestResponse.body.accessToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].text).toBe("Hi there");
    expect(response.body.data[0].isRead).toBe(true);
  });

  it("Should count unread messages", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const guestResponse = await registerUser({
      username: "guest1",
      email: "guest1@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);
    const booking = await createBooking({
      campgroundId: campground._id,
      accessToken: guestResponse.body.accessToken,
    });
    expect(booking.status).toBe(201);

    const createConversationResponse = await createConversationWithGuest({
      campgroundId: campground._id,
      guestId: guestResponse.body.data._id,
      accessToken: ownerResponse.body.accessToken,
    });
    expect(createConversationResponse.status).toBe(201);

    const message = await sendMessage({
      conversationId: createConversationResponse.body.data.conversation._id,
      accessToken: guestResponse.body.accessToken,
    });
    expect(message.status).toBe(201);
    expect(message.body.data.text).toBe("Hi there");

    const response = await fetchConversations(ownerResponse.body.accessToken);
    expect(response.status).toBe(200);
    const conversation = response.body.conversations.find(
      (conversation) =>
        conversation._id ===
        createConversationResponse.body.data.conversation._id,
    );
    expect(conversation).toBeDefined();
    expect(conversation.unreadCount).toBe(1);
  });
});
