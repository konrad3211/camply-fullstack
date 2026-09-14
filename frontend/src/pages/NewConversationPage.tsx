import { useEffect, useState, type SubmitEventHandler } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { MessageSquareText } from "lucide-react";

import {
  checkIsThereConversation,
  startConversation,
  startConversationWithGuest,
} from "@/api/conversation.api";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/types/conversation";
import type { User } from "@/types/user";

type NewConversationLocationState = {
  campgroundId?: string;
  guest?: User;
  action?: string;
};

const NewConversationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as NewConversationLocationState | null;
  const campgroundId = state?.campgroundId;
  const guestId = state?.guest?._id;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const isConversation = async () => {
      if (!campgroundId || !guestId) return;
      try {
        const data = await checkIsThereConversation(campgroundId, guestId);
        setConversation(data.data);
      } catch (error) {
        console.error("Failed to check if there is a conversation", error);
      }
    };
    isConversation();
  }, [campgroundId, guestId]);

  if (!campgroundId) {
    return <Navigate to="/" replace />;
  }

  if (conversation) {
    return <Navigate to={`/conversations/${conversation._id}`} replace />;
  }

  const handleSubmitContactOwner: SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    if (!campgroundId || !guestId) return;

    const trimmedText = messageText.trim();

    if (!trimmedText || isSending) {
      return;
    }

    try {
      setIsSending(true);
      setError("");

      const data = await startConversationWithGuest(campgroundId, guestId, {
        text: trimmedText,
      });

      navigate(`/conversations/${data.data.conversation._id}`, {
        replace: true,
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitContactGuest: SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    const trimmedText = messageText.trim();

    if (!trimmedText || isSending) {
      return;
    }

    try {
      setIsSending(true);
      setError("");

      const data = await startConversation(campgroundId, {
        text: trimmedText,
      });

      navigate(`/conversations/${data.data.conversation._id}`, {
        replace: true,
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-10">
      <div className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquareText className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Contact owner
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Send a message to the campground owner. They’ll be able to reply
              in your conversations.
            </p>
          </div>
        </div>

        <form
          onSubmit={
            state.action === "contactGuest"
              ? handleSubmitContactOwner
              : handleSubmitContactGuest
          }
          className="space-y-5"
        >
          <div className="space-y-2">
            <label
              htmlFor="message"
              className="text-sm font-medium leading-none"
            >
              Message
            </label>

            <textarea
              id="message"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Hi, I’d like to ask about..."
              disabled={isSending}
              maxLength={1000}
              className="min-h-44 w-full resize-none rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <div className="flex justify-between">
              <div>
                {error && (
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {messageText.length}/1000
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t pt-5">
            <Button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="min-w-32"
            >
              {isSending ? "Sending..." : "Send message"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default NewConversationPage;
