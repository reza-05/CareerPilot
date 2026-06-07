"use client";

import type React from "react";
import { Pencil, UserRound } from "lucide-react";
import type { CareerProfile } from "@/lib/profileData";

type ProfileAvatarProps = {
  profile: Pick<CareerProfile, "photoDataUrl" | "firstName" | "lastName">;
  fallbackName?: string | null;
  size?: "nav" | "md" | "lg";
  editable?: boolean;
  onPhotoChange?: (photoDataUrl: string) => void;
  className?: string;
};

const sizeClasses = {
  nav: "h-9 w-9 sm:h-10 sm:w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24 sm:h-28 sm:w-28",
};

const iconSizes = {
  nav: 18,
  md: 28,
  lg: 42,
};

function getInitial(profile: ProfileAvatarProps["profile"], fallbackName?: string | null) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || fallbackName || "";
  return name.trim().slice(0, 1).toUpperCase();
}

export default function ProfileAvatar({
  profile,
  fallbackName,
  size = "md",
  editable = false,
  onPhotoChange,
  className = "",
}: ProfileAvatarProps) {
  const initial = getInitial(profile, fallbackName);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onPhotoChange) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 6_000_000) {
      window.alert("Please choose an image under 6MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 520;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      onPhotoChange(canvas.toDataURL("image/jpeg", 0.86));
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => URL.revokeObjectURL(objectUrl);
    image.src = objectUrl;
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} flex items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-[#1E3A8A] bg-cover bg-center text-xl font-black text-white shadow-lg shadow-blue-900/20 dark:border-blue-400/25`}
        style={profile.photoDataUrl ? { backgroundImage: `url(${profile.photoDataUrl})` } : undefined}
        aria-label="Profile photo"
      >
        {!profile.photoDataUrl && (
          initial ? (
            <span className={size === "lg" ? "text-4xl" : size === "md" ? "text-xl" : "text-sm"}>{initial}</span>
          ) : (
            <UserRound size={iconSizes[size]} strokeWidth={2.25} />
          )
        )}
      </div>

      {editable && onPhotoChange && (
        <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-blue-100 bg-white text-[#1E3A8A] shadow-md shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-50 dark:border-blue-400/25 dark:bg-slate-900 dark:text-blue-100 dark:hover:bg-slate-800">
          <Pencil size={15} strokeWidth={2.6} />
          <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}
