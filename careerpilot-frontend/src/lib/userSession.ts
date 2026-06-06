export function getProfileReadyKey(userId: string) {
  return `careerpilot_profile_ready_${userId}`;
}

export type CvUploadState = {
  uploaded: boolean;
  fileName: string;
  skills: string[];
  updatedAt: string;
};

const emptyCvUploadState: CvUploadState = {
  uploaded: false,
  fileName: "",
  skills: [],
  updatedAt: "",
};

export function getCvUploadStateKey(userId: string) {
  return `careerpilot_cv_upload_state_${userId}`;
}

export function getTrackerGoalsKey(userId: string) {
  return `careerpilot_tracker_goals_${userId}`;
}

export function getTrackerActivityKey(userId: string) {
  return `careerpilot_tracker_activity_${userId}`;
}

export function getJobHunterStateKey(userId: string) {
  return `careerpilot_job_hunter_state_${userId}`;
}

export function getAssistantChatStateKey(userId: string) {
  return `careerpilot_assistant_chat_state_${userId}`;
}

export function resetCvDependentWorkspace(userId: string) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(getJobHunterStateKey(userId));
  window.localStorage.removeItem(getAssistantChatStateKey(userId));
  window.localStorage.removeItem("jobAnalysis");
}

export function markProfileReady(userId: string) {
  window.sessionStorage.setItem(getProfileReadyKey(userId), "true");
  window.localStorage.setItem(getProfileReadyKey(userId), "true");
}

export function markCvUploaded(userId: string, fileName?: string, skills: string[] = []) {
  if (typeof window === "undefined") return;

  resetCvDependentWorkspace(userId);
  markProfileReady(userId);
  window.localStorage.setItem(
    getCvUploadStateKey(userId),
    JSON.stringify({
      uploaded: true,
      fileName: fileName || "Saved resume",
      skills,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function loadCvUploadState(userId?: string | null): CvUploadState {
  if (!userId || typeof window === "undefined") {
    return emptyCvUploadState;
  }

  try {
    const saved = window.localStorage.getItem(getCvUploadStateKey(userId));
    if (!saved) {
      return {
        ...emptyCvUploadState,
        uploaded: hasProfileReady(userId),
      };
    }

    const parsed = JSON.parse(saved) as Partial<CvUploadState>;
    return {
      ...emptyCvUploadState,
      ...parsed,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    };
  } catch {
    return {
      ...emptyCvUploadState,
      uploaded: hasProfileReady(userId),
    };
  }
}

export function hasProfileReady(userId?: string | null) {
  if (!userId || typeof window === "undefined") return false;
  const key = getProfileReadyKey(userId);
  return window.sessionStorage.getItem(key) === "true" || window.localStorage.getItem(key) === "true";
}
