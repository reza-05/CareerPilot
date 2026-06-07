export type CareerProfile = {
  photoDataUrl: string;
  firstName: string;
  lastName: string;
  headline: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  linkedIn: string;
  github: string;
  summary: string;
  sscSchool: string;
  sscGroup: string;
  sscYear: string;
  sscGpa: string;
  hscCollege: string;
  hscGroup: string;
  hscYear: string;
  hscGpa: string;
  uniDegree: string;
  uniName: string;
  uniMajor: string;
  uniYear: string;
  uniGpa: string;
  isWorkEnabled: boolean;
  workTitle: string;
  workCompany: string;
  workYear: string;
  workDesc: string;
  skills: string;
  languages: string;
  projects: string;
  certs: string;
};

export const defaultCareerProfile: CareerProfile = {
  photoDataUrl: "",
  firstName: "",
  lastName: "",
  headline: "",
  email: "",
  phone: "",
  address: "",
  dob: "",
  linkedIn: "",
  github: "",
  summary: "",
  sscSchool: "",
  sscGroup: "",
  sscYear: "",
  sscGpa: "",
  hscCollege: "",
  hscGroup: "",
  hscYear: "",
  hscGpa: "",
  uniDegree: "",
  uniName: "",
  uniMajor: "",
  uniYear: "",
  uniGpa: "",
  isWorkEnabled: false,
  workTitle: "",
  workCompany: "",
  workYear: "",
  workDesc: "",
  skills: "",
  languages: "",
  projects: "",
  certs: "",
};

export const CAREER_PROFILE_UPDATED_EVENT = "careerpilot:profile-updated";

export function getCareerProfileKey(userId: string) {
  return `careerpilot_career_profile_${userId}`;
}

export function buildProfileFromUser(user?: { displayName?: string | null; email?: string | null } | null): CareerProfile {
  const profile = { ...defaultCareerProfile };

  if (user?.email) {
    profile.email = user.email;
  }

  if (user?.displayName) {
    const [firstName, ...rest] = user.displayName.trim().split(/\s+/);
    profile.firstName = firstName || "";
    profile.lastName = rest.join(" ");
  }

  return profile;
}

export function loadCareerProfile(
  userId?: string | null,
  fallbackUser?: { displayName?: string | null; email?: string | null } | null,
): CareerProfile {
  const fallback = buildProfileFromUser(fallbackUser);

  if (!userId || typeof window === "undefined") {
    return fallback;
  }

  try {
    const saved = window.localStorage.getItem(getCareerProfileKey(userId));
    if (!saved) return fallback;

    return {
      ...fallback,
      ...(JSON.parse(saved) as Partial<CareerProfile>),
    };
  } catch {
    return fallback;
  }
}

export function saveCareerProfile(userId: string, profile: CareerProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getCareerProfileKey(userId), JSON.stringify(profile));
  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(CAREER_PROFILE_UPDATED_EVENT, {
        detail: { userId },
      }),
    );
  }, 0);
}

export function normalizeSkillList(skills: unknown): string[] {
  const rawSkills = Array.isArray(skills)
    ? skills
    : typeof skills === "string"
      ? skills.split(/[,;\n]/)
      : [];

  const seen = new Set<string>();
  return rawSkills
    .map((skill) => String(skill).trim())
    .filter(Boolean)
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function mergeProfileSkills(profile: CareerProfile, skills: unknown): CareerProfile {
  const normalizedSkills = normalizeSkillList(skills);
  if (normalizedSkills.length === 0) return profile;

  return {
    ...profile,
    skills: normalizedSkills.join(", "),
  };
}
