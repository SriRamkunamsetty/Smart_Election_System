// Static India election guide data — illustrative reference content.
export type Step = {
  id: string;
  title: string;
  short: string;
  body: string;
  link?: { label: string; href: string };
  estimatedMinutes: number;
};

export const STEPS: Step[] = [
  {
    id: "eligibility",
    title: "Check your eligibility",
    short: "Indian citizen, 18+ on qualifying date.",
    body: "You must be a citizen of India and at least 18 years old as of the qualifying date (1st January of the year of revision of the electoral roll). You must be ordinarily resident in the constituency where you wish to vote.",
    link: {
      label: "Eligibility on ECI",
      href: "https://eci.gov.in/voter/voter/",
    },
    estimatedMinutes: 2,
  },
  {
    id: "register",
    title: "Register on Form 6 (NVSP / Voter Helpline)",
    short: "Apply online via NVSP or the Voter Helpline app.",
    body: "Submit Form 6 at voters.eci.gov.in or via the Voter Helpline app. You'll need a passport-size photo, an identity proof, and an address proof (Aadhaar, passport, driving licence, utility bill, etc.).",
    link: {
      label: "Voters Service Portal",
      href: "https://voters.eci.gov.in",
    },
    estimatedMinutes: 10,
  },
  {
    id: "verify",
    title: "Verify your name in the electoral roll",
    short: "Search by EPIC number, name, or mobile.",
    body: "Use 'Search in Electoral Roll' to confirm your entry, EPIC (Voter ID) number, part number and serial number — you'll need them on polling day to find your booth quickly.",
    link: {
      label: "Search Electoral Roll",
      href: "https://electoralsearch.eci.gov.in",
    },
    estimatedMinutes: 3,
  },
  {
    id: "epic",
    title: "Download your e-EPIC (digital Voter ID)",
    short: "Get a PDF Voter ID linked to your mobile.",
    body: "Once registered and your mobile is linked, download the e-EPIC — a secure PDF version of your Voter ID. Acceptable as ID at most polling stations alongside the physical card.",
    estimatedMinutes: 5,
  },
  {
    id: "booth",
    title: "Find your polling booth",
    short: "Locate your assigned booth on the map.",
    body: "Your booth is determined by your part number in the roll. Check the address and route in advance — booths can change between elections.",
    estimatedMinutes: 4,
  },
  {
    id: "vote",
    title: "Vote on polling day",
    short: "Carry EPIC + one approved photo ID.",
    body: "Reach the booth between 7am and 6pm (timings may vary). Carry your EPIC or any approved alternative photo ID (Aadhaar, passport, driving licence, PAN, etc.). Press the EVM button next to your candidate, verify the VVPAT slip, and confirm the indelible ink mark on your finger.",
    estimatedMinutes: 30,
  },
];

// Illustrative election date — replace with live ECI data when wiring real sources.
export const NEXT_ELECTION_DATE = new Date(
  new Date().getFullYear() + 1,
  3,
  19,
  7,
  0,
  0,
);
