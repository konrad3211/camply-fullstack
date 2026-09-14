import { describe, it, expect, vi } from "vitest";
import request from "supertest";

vi.mock("../src/lib/cloudinary.js", async () => {
  const actual = await vi.importActual("../src/lib/cloudinary.js");

  return {
    ...actual,
    default: {
      ...actual.default,
      uploader: {
        ...actual.default.uploader,
        destroy: vi.fn().mockResolvedValue({ result: "ok" }),
      },
    },
  };
});

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

describe("Campgrounds", () => {
  it("Should return 401 when unauthenticated user tries to create campground", async () => {
    const response = await request(app).post("/api/campgrounds").send({
      title: "Test Campground",
      description: "Test description",
      price: 100,
      city: "Glogow",
      street: "Testowa",
      houseNumber: "1",
    });

    expect(response.status).toBe(401);
  });

  it("Should return 403 when user tries to update someone else's campground", async () => {
    const ownerResponse = await registerUser({
      username: "testuser1",
      email: "test@email.com",
    });

    const otherUserResponse = await registerUser({
      username: "testuser2",
      email: "test2@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await request(app)
      .patch(`/api/campgrounds/${campground._id}`)
      .set("Authorization", `Bearer ${otherUserResponse.body.accessToken}`)
      .send({
        title: "Hacked title",
      });

    expect(response.status).toBe(403);
  });

  it("Should allow owner to update own campground", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await request(app)
      .patch(`/api/campgrounds/${campground._id}`)
      .set("Authorization", `Bearer ${ownerResponse.body.accessToken}`)
      .send({
        title: "Updated Campground",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe("Updated Campground");
  });

  it("Should return 403 when user tries to delete someone else's campground", async () => {
    const ownerResponse = await registerUser({
      username: "testuser1",
      email: "test@email.com",
    });

    const otherUserResponse = await registerUser({
      username: "testuser2",
      email: "test2@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const response = await request(app)
      .delete(`/api/campgrounds/${campground._id}`)
      .set("Authorization", `Bearer ${otherUserResponse.body.accessToken}`);

    expect(response.status).toBe(403);
  });

  it("Should allow owner to delete own campground", async () => {
    const ownerResponse = await registerUser({
      username: "owneruser",
      email: "owner@email.com",
    });

    const campground = await createTestCampground(ownerResponse.body.data._id);

    const deleteResponse = await request(app)
      .delete(`/api/campgrounds/${campground._id}`)
      .set("Authorization", `Bearer ${ownerResponse.body.accessToken}`);

    expect(deleteResponse.status).toBe(200);

    const getResponse = await request(app).get(
      `/api/campgrounds/${campground._id}`,
    );

    expect(getResponse.status).toBe(404);
  });
});
