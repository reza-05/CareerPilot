import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase";

type CloudPayload<T> = {
  data?: T;
  updatedAt?: unknown;
};

const COLLECTION_NAME = "careerpilot_users";

function canUseCloud(userId?: string | null) {
  return Boolean(userId && firebaseDb);
}

export async function loadUserCloudData<T>(userId: string | null | undefined, key: string): Promise<T | null> {
  if (!canUseCloud(userId) || !firebaseDb || !userId) return null;

  try {
    const snapshot = await getDoc(doc(firebaseDb, COLLECTION_NAME, userId, "workspace", key));
    if (!snapshot.exists()) return null;

    const payload = snapshot.data() as CloudPayload<T>;
    return payload.data ?? null;
  } catch (error) {
    console.warn(`CareerPilot cloud load skipped for ${key}:`, error);
    return null;
  }
}

export async function saveUserCloudData<T>(userId: string | null | undefined, key: string, data: T): Promise<boolean> {
  if (!canUseCloud(userId) || !firebaseDb || !userId) return false;

  try {
    await setDoc(
      doc(firebaseDb, COLLECTION_NAME, userId, "workspace", key),
      {
        data,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (error) {
    console.warn(`CareerPilot cloud save skipped for ${key}:`, error);
    return false;
  }
}
