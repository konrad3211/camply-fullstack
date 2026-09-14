import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import type { Conversation } from "../types/conversation";
import type { Message } from "../types/message";

import { getConversations } from "../api/conversation.api";
import { socket } from "../lib/socket";

import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import PageLoader from "@/components/PageLoader";
import ErrorState from "@/components/ErrorState";

const ConversationsPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = useAuthStore((state) => state.user);

  const getLastMessageLabel = (conversation: Conversation) => {
    const sender = conversation?.lastMessage?.sender;
    if (!sender) return;

    const isCurrentUser = sender?._id === currentUser?._id;
    const isOwner = sender?._id === conversation?.campground?.author?._id;

    if (isCurrentUser) {
      return "You: ";
    }

    if (isOwner) {
      return `${sender.fullName.split(" ")[0]} (Owner): `;
    }

    return `${sender.fullName.split(" ")[0]}: `;
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setError("");

        const data = await getConversations();

        setConversations(data.conversations);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);

        setError("Failed to fetch conversations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const handleNewConversation = async ({
      conversation,
      message,
    }: {
      conversation: Conversation;
      message: Message;
    }) => {
      setConversations((prevConversations) => [
        {
          ...conversation,
          lastMessage: message,
          unreadCount: (conversation.unreadCount ?? 0) + 1,
        },
        ...prevConversations,
      ]);
    };

    socket.on("newConversation", handleNewConversation);
    return () => {
      socket.off("newConversation", handleNewConversation);
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      setConversations((previousConversations) =>
        previousConversations
          .map((conversation) =>
            conversation._id === newMessage.conversation
              ? {
                  ...conversation,
                  lastMessage: newMessage,
                  unreadCount: (conversation.unreadCount ?? 0) + 1,
                  updatedAt: newMessage.createdAt,
                }
              : conversation,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
      );
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>

        <p className="text-muted-foreground">
          Messages about your campground bookings and stays.
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <MessageCircle className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-lg font-semibold">No conversations yet</h2>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When you contact a campground owner, your conversation will appear
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => {
            const unreadCount = conversation.unreadCount ?? 0;

            const hasUnreadMessages = unreadCount > 0;

            const imageUrl = conversation.campground.images?.[0]?.url;

            return (
              <Link
                key={conversation._id}
                to={`/conversations/${conversation._id}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={conversation.campground.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <MessageCircle className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2
                            className={`truncate ${
                              hasUnreadMessages
                                ? "font-semibold"
                                : "font-medium"
                            }`}
                          >
                            {conversation.campground.title}
                          </h2>

                          <p
                            className={`mt-1 truncate text-sm ${
                              hasUnreadMessages
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {getLastMessageLabel(conversation)}

                            {conversation.lastMessage?.text ??
                              "No messages yet"}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              conversation.updatedAt,
                            ).toLocaleDateString("pl-PL", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>

                          {hasUnreadMessages && (
                            <span className="flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ConversationsPage;
