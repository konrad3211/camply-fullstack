import { Booking } from "../models/booking.model.js";
import { Campground } from "../models/campground.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { AppError } from "../utils/appError.js";

export const startConversation = async (req, res) => {
  const { campgroundId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  const campground = await Campground.findById(campgroundId);

  if (!campground) {
    throw new AppError("Campground not found", 404);
  }

  const ownerId = campground.author;

  if (ownerId.equals(userId)) {
    throw new AppError("You cannot start a conversation with yourself", 400);
  }

  let conversation = await Conversation.findOne({
    campground: campgroundId,
    participants: {
      $all: [userId, ownerId],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      campground: campgroundId,
      participants: [userId, ownerId],
    });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: userId,
    text,
  });

  conversation.lastMessage = message._id;

  await conversation.save();

  await message.populate("sender", "username fullName imageUrl");
  await conversation.populate({
    path: "campground",
    select: "title images.url",
  });

  const io = req.app.get("io");

  io.to(`user:${ownerId.toString()}`).emit("newConversation", {
    conversation,
    message,
  });

  res.status(201).json({
    success: true,
    message: "Conversation started successfully",
    data: {
      conversation,
      message,
    },
  });
};

export const startConversationWithGuest = async (req, res) => {
  const ownerIdfromValidation = req.user._id;
  const { guestId, campgroundId } = req.params;
  const { text } = req.body;

  const campground = await Campground.findById(campgroundId);

  if (!campground) {
    throw new AppError("Campground not found", 404);
  }

  const ownerId = campground.author;

  if (!ownerId.equals(ownerIdfromValidation)) {
    throw new AppError("You are not the owner", 400);
  }

  const booking = await Booking.exists({
    campground: campgroundId,
    user: guestId,
    type: "booking",
  });

  if (!booking) {
    throw new AppError("This user has no booking for this campground", 403);
  }

  let conversation = await Conversation.findOne({
    campground: campgroundId,
    participants: {
      $all: [guestId, ownerId],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      campground: campgroundId,
      participants: [guestId, ownerId],
    });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: ownerId,
    text,
  });

  conversation.lastMessage = message._id;

  await conversation.save();

  await message.populate("sender", "username fullName imageUrl");

  await conversation.populate([
    {
      path: "campground",
      select: "title images.url author",
      populate: {
        path: "author",
        select: "_id",
      },
    },
    {
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "_id",
      },
    },
  ]);

  const io = req.app.get("io");

  io.to(`user:${guestId.toString()}`).emit("newConversation", {
    conversation,
    message,
  });

  res.status(201).json({
    success: true,
    message: "Conversation started successfully",
    data: {
      conversation,
      message,
    },
  });
};

export const getExistingConversation = async (req, res) => {
  const userId = req.user._id;
  const { guestId, campgroundId } = req.params;

  if (!guestId || !campgroundId) {
    throw new AppError("Guest ID and campground ID are required", 400);
  }

  const conversation = await Conversation.findOne({
    campground: campgroundId,
    participants: {
      $all: [userId, guestId],
    },
  });

  res.status(200).json({
    success: true,
    data: conversation,
  });
};

export const createMessage = async (req, res) => {
  const { text } = req.body;
  const userId = req.user._id;

  const conversation = req.conversation;

  const message = await Message.create({
    conversation: conversation._id,
    sender: userId,
    text,
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  await message.populate("sender", "username fullName imageUrl");

  const recipientId = conversation.participants.find(
    (participantId) => !participantId.equals(userId),
  );

  if (!recipientId) {
    throw new AppError("Message recipient not found", 500);
  }

  const io = req.app.get("io");

  io.to(`user:${recipientId.toString()}`).emit("newMessage", message);

  res.status(201).json({
    success: true,
    message: "Message has been sent successfully",
    data: message,
  });
};

export const getConversations = async (req, res) => {
  const userId = req.user._id;
  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate("participants", "username fullName imageUrl")
    .populate({
      path: "campground",
      select: "title images author",
      populate: {
        path: "author",
        select: "username fullName imageUrl",
      },
    })
    .populate({
      path: "lastMessage",
      select: "text isRead sender createdAt updatedAt",
      populate: {
        path: "sender",
        select: "username fullName imageUrl",
      },
    })
    .sort({ updatedAt: -1 });

  const conversationIds = conversations.map((conversation) => conversation._id);

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        conversation: {
          $in: conversationIds,
        },
        isRead: false,
        sender: {
          $ne: userId,
        },
      },
    },
    {
      $group: {
        _id: "$conversation",
        unreadCount: {
          $sum: 1,
        },
      },
    },
  ]);
  //tutaj jest toObject poniewaz jak robimy spread to pokazujemy cala strukture obiektu mongoose, wiec musimy dac toObject aby wynik wygladal schludnie. Robimy spread poniewaz chcemy miec jeden obiekt ktory ma conversation i unreadCount a nie conversation: {} i unreadConut: {}

  const conversationsWithUnreadCount = conversations.map((conversation) => {
    const unreadData = unreadCounts.find(
      (item) => item._id.toString() === conversation._id.toString(),
    );
    return {
      ...conversation.toObject(),
      unreadCount: unreadData?.unreadCount ?? 0,
    };
  });

  res.status(200).json({
    success: true,
    message:
      conversations.length === 0
        ? "You do not have any conversations"
        : "Conversations have been fetched successfully",
    conversations: conversationsWithUnreadCount,
  });
};

export const getConversationMessages = async (req, res) => {
  const conversation = req.conversation;

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const skip = (page - 1) * limit;

  const totalMessages = await Message.countDocuments({
    conversation: conversation._id,
  });

  const messages = await Message.find({
    conversation: conversation._id,
  })
    .populate("sender", "username fullName imageUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  messages.reverse();

  res.status(200).json({
    success: true,
    message:
      totalMessages === 0
        ? "You do not have any messages in this conversation"
        : messages.length === 0
          ? "No messages found on this page"
          : "Messages have been fetched successfully",

    page,
    limit,
    totalMessages,
    //sprawdza czy sa jeszcze starsze wiadomosci np. 1st 0 + 30 < 50 === true
    hasMore: skip + messages.length < totalMessages,
    messages,
  });
};

export const markMessagesAsRead = async (req, res) => {
  const conversation = req.conversation;
  const userId = req.user._id;
  const recipientId = conversation.participants.find(
    (participantId) => !participantId.equals(userId),
  );

  const filter = {
    conversation: conversation._id,
    sender: { $ne: userId },
    isRead: false,
  };

  //bierzemy dokumenty mongoose
  const messageIds = await Message.distinct("_id", filter);

  await Message.updateMany(
    {
      _id: { $in: messageIds },
    },
    {
      $set: {
        isRead: true,
      },
    },
  );

  const updatedMessages = await Message.find({
    _id: { $in: messageIds },
  }).populate("sender", "username fullName imageUrl");

  if (recipientId) {
    const io = req.app.get("io");

    io.to(`user:${recipientId.toString()}`).emit("messagesRead", {
      conversationId: conversation._id.toString(),
      messageIds: updatedMessages.map((message) => message._id.toString()),
    });
  }

  res.status(200).json({
    success: true,
    message: "Messages marked as read",
    data: updatedMessages,
  });
};
