
export const DEFAULT_PROFILE_IMAGE = "/images/default-profile.svg";

export function fallbackToDefaultProfile(event) {
  if (event.currentTarget.src.endsWith(DEFAULT_PROFILE_IMAGE)) return;
  event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
}
