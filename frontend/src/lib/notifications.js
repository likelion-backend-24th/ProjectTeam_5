import { request } from "./client";

export function getMyNotifications() {
  return request("/api/v1/notifications?size=20", {
    method: "GET",
    fallbackMessage: "알림을 불러오지 못했습니다.",
  });
}

export function getUnreadCount() {
  return request("/api/v1/notifications/unread-count", {
    method: "GET",
    fallbackMessage: "알림 개수를 불러오지 못했습니다.",
  });
}

export function markNotificationAsRead(notificationId) {
  return request(`/api/v1/notifications/${notificationId}/read`, {
    method: "PATCH",
    fallbackMessage: "알림을 읽음 처리하지 못했습니다.",
  });
}

export function markAllNotificationsAsRead() {
  return request("/api/v1/notifications/read-all", {
    method: "PATCH",
    fallbackMessage: "알림을 읽음 처리하지 못했습니다.",
  });
}

export function deleteReadNotifications() {
  return request("/api/v1/notifications/read", {
    method: "DELETE",
    fallbackMessage: "읽은 알림을 삭제하지 못했습니다.",
  });
}

export function deleteNotification(notificationId) {
  return request(`/api/v1/notifications/${notificationId}`, {
    method: "DELETE",
    fallbackMessage: "알림을 삭제하지 못했습니다.",
  });
}
