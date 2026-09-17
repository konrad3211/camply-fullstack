import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { Campground } from "../src/models/campground.model.js";
import { Review } from "../src/models/review.model.js";
import { User } from "../src/models/user.model.js";
import { Conversation } from "../src/models/conversation.model.js";
import { Message } from "../src/models/message.model.js";
import { Booking } from "../src/models/booking.model.js";

import cloudinary from "../src/lib/cloudinary.js";
import { campgroundSeeds } from "./campgrounds.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_PASSWORD = "Demo123!";

const demoUsers = [
  {
    username: "camplyowner",
    fullName: "Camply Owner",
    email: "owner@camply.demo",
    password: DEMO_PASSWORD,
  },
  {
    username: "camplyguest",
    fullName: "Camply Guest",
    email: "guest@camply.demo",
    password: DEMO_PASSWORD,
  },
  {
    username: "annaexplores",
    fullName: "Anna Kowalska",
    email: "anna@camply.demo",
    password: DEMO_PASSWORD,
  },
  {
    username: "mateusztravels",
    fullName: "Mateusz Nowak",
    email: "mateusz@camply.demo",
    password: DEMO_PASSWORD,
  },
];

const reviewTexts = [
  "Beautiful location and a very peaceful atmosphere. I would definitely come back.",
  "Great place for a weekend trip. Everything was clean and the surroundings were amazing.",
  "Really enjoyed our stay. The area is quiet and perfect for relaxing.",
  "Very nice campground with plenty of space and beautiful nature around it.",
  "The location was excellent and the whole stay was comfortable.",
  "Perfect place for hiking and spending time outdoors.",
  "A great camping experience. The views were even better than expected.",
  "Quiet, clean and surrounded by nature. Highly recommended.",
];

const reviewRatings = [5, 5, 4, 5, 4, 5, 5, 4];

const conversationMessages = [
  [
    {
      sender: "guest",
      text: "Hi! Is the campground available next weekend?",
    },
    {
      sender: "owner",
      text: "Hi! Yes, it is currently available.",
    },
    {
      sender: "guest",
      text: "Great, thank you. Is there access to electricity on the campsite?",
    },
    {
      sender: "owner",
      text: "Yes, there are several electricity points available for guests.",
    },
    {
      sender: "guest",
      text: "Perfect, thanks! We are looking forward to our stay.",
    },
  ],

  [
    {
      sender: "anna",
      text: "Hello! Is the lake suitable for swimming?",
    },
    {
      sender: "owner",
      text: "Yes, there is a swimming area close to the campground.",
    },
    {
      sender: "anna",
      text: "Perfect. We are planning to come with two children.",
    },
    {
      sender: "owner",
      text: "Sounds great. The area is family friendly and very quiet.",
    },
  ],

  [
    {
      sender: "mateusz",
      text: "Hi, can I arrive later in the evening?",
    },
    {
      sender: "owner",
      text: "Sure. Just send me a message on the day of arrival.",
    },
    {
      sender: "mateusz",
      text: "Thanks! We should arrive around 20:00.",
    },
    {
      sender: "owner",
      text: "No problem. I will make sure everything is ready for you.",
    },
  ],
];

const seedImages = {
  lake: [
    "lake-1.avif",
    "lake-2.avif",
    "lake-3.avif",
    "lake-4.avif",
    "lake-5.avif",
    "lake-6.avif",
  ],

  forest: [
    "forest-1.avif",
    "forest-2.avif",
    "forest-3.avif",
    "forest-4.avif",
    "forest-5.avif",
    "forest-6.avif",
  ],

  mountain: [
    "mountain-1.avif",
    "mountain-2.avif",
    "mountain-3.avif",
    "mountain-4.avif",
    "mountain-5.avif",
    "mountain-6.avif",
  ],

  coast: [
    "coast-1.avif",
    "coast-2.avif",
    "coast-3.avif",
    "coast-4.avif",
    "coast-5.avif",
    "coast-6.avif",
  ],
};

const descriptions = {
  lake: [
    "A peaceful campground surrounded by nature and located close to a beautiful lake.",
    "A quiet lakeside escape perfect for swimming, kayaking and relaxing by the water.",
    "A scenic campground near the lake with plenty of space for outdoor activities.",
  ],

  forest: [
    "A quiet campground surrounded by dense forest and hiking trails.",
    "A peaceful forest retreat with fresh air and easy access to nature.",
    "A calm woodland campground far away from busy roads and city noise.",
  ],

  mountain: [
    "A scenic campground surrounded by mountains with easy access to hiking trails.",
    "A peaceful mountain base camp with beautiful views and outdoor activities nearby.",
    "An ideal place for mountain lovers looking for fresh air and hiking opportunities.",
  ],

  coast: [
    "A relaxing campground close to the Baltic coast and surrounded by pine forests.",
    "Enjoy fresh sea air and sandy beaches from this peaceful coastal campground.",
    "A comfortable camping spot near the Baltic Sea, perfect for summer holidays.",
  ],
};

const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getSeedImages = (category, index) => {
  const images = seedImages[category];

  if (!images) {
    throw new Error(`Invalid seed category: ${category}`);
  }

  const offset = index % images.length;

  return [...images.slice(offset), ...images.slice(0, offset)];
};

const uploadSeedImages = async (campground, index) => {
  const imageNames = getSeedImages(campground.type, index);

  const uploadedImages = await Promise.all(
    imageNames.map(async (imageName, imageIndex) => {
      const imagePath = path.join(__dirname, "images", imageName);

      const result = await cloudinary.uploader.upload(imagePath, {
        folder: `camply/seeds/campground-${index + 1}`,
        public_id: `image-${imageIndex + 1}`,
        overwrite: true,
      });

      return {
        url: result.secure_url,
        filename: result.public_id,
      };
    }),
  );

  return uploadedImages;
};

const deleteExistingCloudinaryFiles = async () => {
  console.log("Finding existing Cloudinary files...");

  const campgrounds = await Campground.find({}).select("images");

  const users = await User.find({
    imageFilename: {
      $exists: true,
      $ne: "",
    },
  }).select("imageFilename");

  const campgroundImageFilenames = campgrounds.flatMap((campground) =>
    campground.images
      .filter((image) => image.filename)
      .map((image) => image.filename),
  );

  const userImageFilenames = users
    .filter((user) => user.imageFilename)
    .map((user) => user.imageFilename);

  const filenames = [
    ...new Set([...campgroundImageFilenames, ...userImageFilenames]),
  ];

  console.log(`Deleting ${filenames.length} Cloudinary files...`);

  await Promise.allSettled(
    filenames.map((filename) => cloudinary.uploader.destroy(filename)),
  );

  await cloudinary.api.delete_resources_by_prefix("camply/seeds/");
};

const clearDatabase = async () => {
  console.log("Deleting all messages...");
  await Message.deleteMany({});

  console.log("Deleting all conversations...");
  await Conversation.deleteMany({});

  console.log("Deleting all bookings...");
  await Booking.deleteMany({});

  console.log("Deleting all reviews...");
  await Review.deleteMany({});

  console.log("Deleting all campgrounds...");
  await Campground.deleteMany({});

  console.log("Deleting all users...");
  await User.deleteMany({});
};

const createDemoUsers = async () => {
  console.log("Creating demo users...");

  const users = await User.create(demoUsers);

  return {
    owner: users[0],
    guest: users[1],
    anna: users[2],
    mateusz: users[3],
  };
};

const createReviewsForCampground = async (
  campground,
  reviewers,
  campgroundIndex,
) => {
  const reviewCount = 3 + (campgroundIndex % 3);

  const reviewIds = [];

  for (let i = 0; i < reviewCount; i++) {
    const reviewer = reviewers[(campgroundIndex + i) % reviewers.length];

    const review = await Review.create({
      author: reviewer._id,

      text: reviewTexts[(campgroundIndex + i) % reviewTexts.length],

      rating: reviewRatings[(campgroundIndex + i) % reviewRatings.length],
    });

    reviewIds.push(review._id);
  }

  campground.reviews = reviewIds;

  await campground.save();
};

const createDemoBookings = async ({ guest, anna, mateusz, campgrounds }) => {
  console.log("Creating demo bookings...");

  if (campgrounds.length < 3) {
    return;
  }

  await Booking.create([
    {
      campground: campgrounds[0]._id,
      user: guest._id,

      checkIn: new Date("2026-10-10T13:00:00.000Z"),
      checkOut: new Date("2026-10-13T10:00:00.000Z"),

      numberOfNights: 3,

      pricePerNight: campgrounds[0].price,
      totalPrice: campgrounds[0].price * 3,

      type: "booking",
      status: "confirmed",
      paymentStatus: "paid",
    },

    {
      campground: campgrounds[1]._id,
      user: anna._id,

      checkIn: new Date("2026-10-17T13:00:00.000Z"),
      checkOut: new Date("2026-10-20T10:00:00.000Z"),

      numberOfNights: 3,

      pricePerNight: campgrounds[1].price,
      totalPrice: campgrounds[1].price * 3,

      type: "booking",
      status: "confirmed",
      paymentStatus: "paid",
    },

    {
      campground: campgrounds[2]._id,
      user: mateusz._id,

      checkIn: new Date("2026-10-24T13:00:00.000Z"),
      checkOut: new Date("2026-10-26T10:00:00.000Z"),

      numberOfNights: 2,

      pricePerNight: campgrounds[2].price,
      totalPrice: campgrounds[2].price * 2,

      type: "booking",
      status: "confirmed",
      paymentStatus: "paid",
    },
  ]);
};

const createDemoConversations = async ({
  owner,
  guest,
  anna,
  mateusz,
  campgrounds,
}) => {
  console.log("Creating demo conversations...");

  const usersByKey = {
    owner,
    guest,
    anna,
    mateusz,
  };

  const conversationUsers = [
    {
      user: guest,
      messages: conversationMessages[0],
    },
    {
      user: anna,
      messages: conversationMessages[1],
    },
    {
      user: mateusz,
      messages: conversationMessages[2],
    },
  ];

  for (let i = 0; i < conversationUsers.length; i++) {
    const conversationData = conversationUsers[i];

    const campground = campgrounds[i];

    if (!campground) {
      continue;
    }

    const conversation = await Conversation.create({
      campground: campground._id,

      participants: [conversationData.user._id, owner._id],
    });

    let lastMessage = null;

    for (const messageData of conversationData.messages) {
      const sender = usersByKey[messageData.sender];

      const message = await Message.create({
        conversation: conversation._id,

        sender: sender._id,

        text: messageData.text,

        isRead: false,
      });

      lastMessage = message;
    }

    if (lastMessage) {
      conversation.lastMessage = lastMessage._id;

      await conversation.save();
    }
  }
};

const createDemoCampgrounds = async ({ owner, reviewers }) => {
  const createdCampgrounds = [];

  for (let i = 0; i < campgroundSeeds.length; i++) {
    const campgroundData = campgroundSeeds[i];

    console.log(
      `Creating ${i + 1}/${campgroundSeeds.length}: ${campgroundData.title}`,
    );

    const images = await uploadSeedImages(campgroundData, i);

    const campground = await Campground.create({
      title: campgroundData.title,

      description: getRandomItem(descriptions[campgroundData.type]),

      city: campgroundData.city,
      street: campgroundData.street,
      houseNumber: campgroundData.houseNumber,

      location: campgroundData.location,

      price: campgroundData.price,

      geometry: {
        type: "Point",
        coordinates: campgroundData.coordinates,
      },

      images,

      author: owner._id,
    });

    await createReviewsForCampground(campground, reviewers, i);

    createdCampgrounds.push(campground);
  }

  return createdCampgrounds;
};

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to database");

    console.log("");
    console.log("Resetting database...");
    console.log("");

    await deleteExistingCloudinaryFiles();

    await clearDatabase();

    console.log("");
    console.log("Creating new demo data...");
    console.log("");

    const { owner, guest, anna, mateusz } = await createDemoUsers();

    const reviewers = [guest, anna, mateusz];

    const createdCampgrounds = await createDemoCampgrounds({
      owner,
      reviewers,
    });

    await createDemoBookings({
      guest,
      anna,
      mateusz,
      campgrounds: createdCampgrounds,
    });

    await createDemoConversations({
      owner,
      guest,
      anna,
      mateusz,
      campgrounds: createdCampgrounds,
    });

    console.log("");
    console.log("--------------------------------");
    console.log("Database seeded successfully");
    console.log("--------------------------------");
    console.log("");

    console.log(`Campgrounds: ${createdCampgrounds.length}`);
    console.log(`Users: ${demoUsers.length}`);

    console.log("");
    console.log("Demo accounts:");
    console.log("");

    console.log(`Owner: owner@camply.demo / ${DEMO_PASSWORD}`);
    console.log(`Guest: guest@camply.demo / ${DEMO_PASSWORD}`);

    console.log("");
  } catch (error) {
    console.error("Failed to seed database:", error);
  } finally {
    await mongoose.connection.close();

    console.log("Database connection closed");
  }
};

seedDatabase();
