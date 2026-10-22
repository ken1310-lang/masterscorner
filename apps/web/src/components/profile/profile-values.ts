import type {
  MasterProfilePayload,
  saveProfileInputSchema,
} from "@my-better-t-app/api/master-profile";
import type { z } from "zod";

export interface ProfileFormRow {
  id?: string;
  name: string;
}

export interface ProfileFormValues {
  displayName: string;
  homeCity: string;
  introduction: string;
  locations: ProfileFormRow[];
  martialArts: ProfileFormRow[];
  yearsTeaching: string;
}

export type SaveProfileValues = z.input<typeof saveProfileInputSchema>;

export function initialProfileValues(
  accountName: string,
  payload: MasterProfilePayload
): ProfileFormValues {
  const arts = payload.martialArts.map(({ id, name }) => ({ id, name }));

  return {
    displayName: payload.profile?.displayName ?? accountName,
    homeCity: payload.profile?.homeCity ?? "",
    introduction: payload.profile?.introduction ?? "",
    locations: payload.locations.map(({ id, name }) => ({ id, name })),
    martialArts: arts.length > 0 ? arts : [{ name: "" }],
    yearsTeaching:
      payload.profile?.yearsTeaching === null ||
      payload.profile?.yearsTeaching === undefined
        ? ""
        : String(payload.profile.yearsTeaching),
  };
}

export function profileValuesToInput(
  values: ProfileFormValues
): SaveProfileValues {
  const yearsTeaching = values.yearsTeaching.trim();

  return {
    displayName: values.displayName,
    homeCity: values.homeCity,
    introduction: values.introduction,
    locations: values.locations.map(({ id, name }) =>
      id ? { id, name } : { name }
    ),
    martialArts: values.martialArts.map(({ id, name }) =>
      id ? { id, name } : { name }
    ),
    yearsTeaching: yearsTeaching === "" ? null : Number(yearsTeaching),
  };
}
