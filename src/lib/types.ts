export interface Person {
  name: string;
  standingIn?: string | undefined;
}

export interface Guest {
  id: string;
  name: string;
  role: string;
  note: string;
}

export type AttachmentKind = "photo" | "doc";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
  caption?: string | undefined;
  tag?: string | undefined;
  isCover?: boolean | undefined;
  originalUrl?: string | undefined;
  signedUrl?: string | undefined;
}

export interface LaunchpadRow {
  id: string;
  name: string;
  introducedBy: string;
  note: string;
}

export interface Announcement {
  id: string;
  type: "Social" | "Policy" | "Open Category" | "Renewal" | "Other";
  text: string;
}

export type Num = number | null;

export interface Scorecard {
  referrals: Num;
  business: Num;
  visitors: Num;
  testimonials: Num;
  oneToOnes: Num;
  goldClub: Num;
  blueBadge: Num;
  onePlus: Num;
  avgSeatValue: Num;
  ctdReferrals: Num;
  ctdBusiness: Num;
}

export interface SectionToggles {
  theme: boolean;
  education: boolean;
  feature: boolean;
  launchpad: boolean;
  recognitions: boolean;
  visitors: boolean;
  termReport: boolean;
  announcements: boolean;
}

export interface Meeting {
  id: string;
  date: string;
  time: string;
  venue: string;
  compiledBy: string;
  leadership: {
    president: Person;
    vicePresident: Person;
    secretary: Person;
    leadVisitorHost: Person;
  };
  guests: Guest[];
  scorecard: Scorecard;
  toggles: SectionToggles;
  theme: { title: string; summary: string };
  education: { speaker: string; topic: string; takeaways: string[] };
  feature: {
    presenters: string;
    introducedBy: string;
    summary: string;
    outcome: string;
  };
  launchpad: LaunchpadRow[];
  recognitions: {
    goldenMike: string;
    topReferrer: { name: string; count: string };
    topBusiness: { name: string; amount: string };
    profileOfMonth: string;
    starPerformer: string;
    special: { name: string; note: string };
    membership: { name: string; note: string };
  };
  visitorsInfo: {
    count: Num;
    categories: string[];
    notable: { name: string; chapter: string; feedback: string };
  };
  termReport: string;
  announcements: Announcement[];
  attachments: Attachment[];
  createdAt: number;
  updatedAt: number;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function emptyMeeting(): Meeting {
  const now = Date.now();
  return {
    id: uid(),
    date: new Date().toISOString().slice(0, 10),
    time: "",
    venue: "",
    compiledBy: "",
    leadership: {
      president: { name: "", standingIn: "" },
      vicePresident: { name: "", standingIn: "" },
      secretary: { name: "", standingIn: "" },
      leadVisitorHost: { name: "", standingIn: "" },
    },
    guests: [],
    scorecard: {
      referrals: null,
      business: null,
      visitors: null,
      testimonials: null,
      oneToOnes: null,
      goldClub: null,
      blueBadge: null,
      onePlus: null,
      avgSeatValue: null,
      ctdReferrals: null,
      ctdBusiness: null,
    },
    toggles: {
      theme: false,
      education: false,
      feature: false,
      launchpad: false,
      recognitions: false,
      visitors: false,
      termReport: false,
      announcements: false,
    },
    theme: { title: "", summary: "" },
    education: { speaker: "", topic: "", takeaways: [""] },
    feature: { presenters: "", introducedBy: "", summary: "", outcome: "" },
    launchpad: [],
    recognitions: {
      goldenMike: "",
      topReferrer: { name: "", count: "" },
      topBusiness: { name: "", amount: "" },
      profileOfMonth: "",
      starPerformer: "",
      special: { name: "", note: "" },
      membership: { name: "", note: "" },
    },
    visitorsInfo: {
      count: null,
      categories: [],
      notable: { name: "", chapter: "", feedback: "" },
    },
    termReport: "",
    announcements: [],
    attachments: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const PHOTO_TAGS = [
  "Group Photo",
  "Feature Presentation",
  "Education Slot",
  "Recognitions",
  "Visitors",
  "Launchpad",
  "Other",
];
