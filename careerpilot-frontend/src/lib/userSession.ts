export function getProfileReadyKey(userId: string) {
  return `careerpilot_profile_ready_${userId}`;
}

export function getTrackerGoalsKey(userId: string) {
  return `careerpilot_tracker_goals_${userId}`;
}

export function getJobHunterStateKey(userId: string) {
  return `careerpilot_job_hunter_state_${userId}`;
}

export function getAssistantChatStateKey(userId: string) {
  return `careerpilot_assistant_chat_state_${userId}`;
}

export function markProfileReady(userId: string) {
  window.sessionStorage.setItem(getProfileReadyKey(userId), "true");
  window.localStorage.setItem(getProfileReadyKey(userId), "true");
}

export function hasProfileReady(userId?: string | null) {
  if (!userId || typeof window === "undefined") return false;
  const key = getProfileReadyKey(userId);
  return window.sessionStorage.getItem(key) === "true" || window.localStorage.getItem(key) === "true";
}
