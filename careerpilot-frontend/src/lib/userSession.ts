import { loadUserCloudData, saveUserCloudData } from "@/lib/cloudStore";
import { buildAuthHeaders } from "@/lib/authHeaders";
import type { User } from "firebase/auth";

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
  const nextState = {
    uploaded: true,
    fileName: fileName || "Saved resume",
    skills,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    getCvUploadStateKey(userId),
    JSON.stringify(nextState),
  );
  void saveUserCloudData(userId, "cvUploadState", nextState);
}

export function restoreCvUploadState(userId: string, fileName?: string, skills: string[] = [], updatedAt?: string) {
  if (typeof window === "undefined") return;

  markProfileReady(userId);
  const nextState = {
    uploaded: true,
    fileName: fileName || "Saved CV",
    skills,
    updatedAt: updatedAt || new Date().toISOString(),
  };
  window.localStorage.setItem(
    getCvUploadStateKey(userId),
    JSON.stringify(nextState),
  );
  void saveUserCloudData(userId, "cvUploadState", nextState);
}

export async function loadCvUploadStateFromCloud(userId?: string | null): Promise<CvUploadState> {
  const localState = loadCvUploadState(userId);
  if (!userId || typeof window === "undefined") return localState;

  const cloudState = await loadUserCloudData<Partial<CvUploadState>>(userId, "cvUploadState");
  if (!cloudState?.uploaded) return localState;

  const mergedState = {
    ...emptyCvUploadState,
    ...cloudState,
    uploaded: true,
    skills: Array.isArray(cloudState.skills) ? cloudState.skills : [],
  };

  markProfileReady(userId);
  window.localStorage.setItem(getCvUploadStateKey(userId), JSON.stringify(mergedState));
  return mergedState;
}

export async function syncCvUploadStateFromServer(userId?: string | null, user?: User | null): Promise<CvUploadState> {
  if (!userId || typeof window === "undefined") {
    return emptyCvUploadState;
  }

  try {
    const response = await fetch("/api/cv-processor", {
      method: "GET",
      headers: await buildAuthHeaders(user ?? ({ uid: userId } as User)),
      cache: "no-store",
    });

    if (!response.ok) return loadCvUploadState(userId);

    const data = await response.json();
    if (data?.success && data?.uploaded) {
      const skills = Array.isArray(data.skills) ? data.skills : [];
      restoreCvUploadState(userId, data.fileName, skills, data.updatedAt);
      return loadCvUploadState(userId);
    }
  } catch {
    // Keep the existing browser state if the local app service is temporarily unreachable.
  }

  const localState = loadCvUploadState(userId);
  if (localState.uploaded) return localState;
  return loadCvUploadStateFromCloud(userId);
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
