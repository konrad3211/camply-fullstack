import { lazy, Suspense, useEffect, useState } from "react";
import { refreshAuth } from "./api/auth.api";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import { socket } from "./lib/socket";
import { toast } from "sonner";
import type { Message } from "./types/message";
import AppLayout from "@/layouts/AppLayout";
import PageLoader from "./components/PageLoader";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ConversationsPage = lazy(() => import("./pages/ConversationsPage"));
const ConversationPage = lazy(() => import("./pages/ConversationPage"));
const CampgroundPage = lazy(() => import("./pages/CampgroundPage"));
const NewConversationPage = lazy(() => import("./pages/NewConversationPage"));
const FakePaymentPage = lazy(() => import("./pages/FakePaymentPage"));
const BookingSuccessPage = lazy(() => import("./pages/BookingSuccessPage"));
const CreateCampgroundPage = lazy(() => import("./pages/CreateCampgroundPage"));
const UpdateCampgroundPage = lazy(() => import("./pages/UpdateCampgroundPage"));
const BookingsPage = lazy(() => import("./pages/BookingsPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const UserCampgroundsPage = lazy(() => import("./pages/UserCampgroundsPage"));
const CampgroundBookingsPage = lazy(
  () => import("./pages/CampgroundBookingsPage"),
);
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const App = () => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        await refreshAuth();
      } catch (error) {
        console.error("User is not logged in:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      socket.disconnect();
      return;
    }
    socket.auth = {
      token: accessToken,
    };

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const handleNewMessagesNotification = (newMessage: Message) => {
      const openedConversationPath = `/conversations/${newMessage.conversation}`;
      const conversationsPath = "/conversations";

      if (
        location.pathname === openedConversationPath ||
        location.pathname === conversationsPath
      )
        return;

      toast.custom(() => (
        <div className="flex w-90 items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
            {newMessage.sender.username[0].toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {newMessage.sender.username}
            </p>

            <p className="mt-1 truncate text-sm text-zinc-300">
              {newMessage.text}
            </p>
          </div>
        </div>
      ));
    };
    socket.on("newMessage", handleNewMessagesNotification);

    return () => {
      socket.off("newMessage", handleNewMessagesNotification);
    };
  }, [location.pathname, accessToken]);

  //to wyswietla Loading... i blokuje przejscie do routes przez co jak sie laduje to routy sie nie beda odpalaly co zapobiegnie roznym rzeczom
  if (isAuthLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/campgrounds/:id" element={<CampgroundPage />} />

          <Route
            path="/campgrounds/user/:userId"
            element={<UserCampgroundsPage />}
          />

          <Route element={<ProtectedRoute />}>
            <Route path="/campgrounds/new" element={<CreateCampgroundPage />} />

            <Route path="/bookings" element={<BookingsPage />} />

            <Route
              path="/campgrounds/:id/update"
              element={<UpdateCampgroundPage />}
            />

            <Route
              path="/campgrounds/:campgroundId/bookings"
              element={<CampgroundBookingsPage />}
            />

            <Route path="/conversations" element={<ConversationsPage />} />

            <Route
              path="/conversations/new"
              element={<NewConversationPage />}
            />

            <Route path="/conversations/:id" element={<ConversationPage />} />

            <Route path="/profile" element={<UserProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/bookings/:bookingId/payment"
            element={<FakePaymentPage />}
          />

          <Route
            path="/bookings/:bookingId/success"
            element={<BookingSuccessPage />}
          />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
