import type { CampgroundImage } from "./campground";
import type { Message } from "./message";
import type { User } from "./user";

type CampgroundPreviewUser = {
  _id: string;
  fullName: string;
  username: string;
};

export type CampgroundPreview = {
  _id: string;
  title: string;
  images: CampgroundImage[];
  author: CampgroundPreviewUser;
};

export type Conversation = {
  _id: string;
  participants: User[];
  campground: CampgroundPreview;
  lastMessage: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type GetConversationResponse = {
  success: boolean;
  message: string;
  conversations: Conversation[];
};

export type CreateConversationResponse = {
  success: boolean;
  message: string;
  data: Conversation;
};
