import {
  type AppState,
  type Candidate,
  type Department,
  INTERVIEW_KINDS,
  type Interview,
  type Job,
  type Member,
  SOURCES,
  STAGES,
} from "./types";

// ponytail: fixed-seed PRNG so every reset gives the same demo data.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDay(d);
};

const members: Member[] = [
  {
    id: "m_ava",
    name: "Ava Lindqvist",
    email: "ava@crewline.example",
    role: "admin",
    title: "Head of Talent",
  },
  {
    id: "m_raj",
    name: "Raj Patel",
    email: "raj@crewline.example",
    role: "recruiter",
    title: "Senior Recruiter",
  },
  {
    id: "m_mei",
    name: "Mei Tanaka",
    email: "mei@crewline.example",
    role: "recruiter",
    title: "Technical Recruiter",
  },
  {
    id: "m_leo",
    name: "Leo Okafor",
    email: "leo@crewline.example",
    role: "interviewer",
    title: "Engineering Manager",
  },
  {
    id: "m_sam",
    name: "Sam Reyes",
    email: "sam@crewline.example",
    role: "interviewer",
    title: "Design Lead",
  },
  {
    id: "m_noa",
    name: "Noa Berger",
    email: "noa@crewline.example",
    role: "interviewer",
    title: "VP Sales",
  },
];

const jobSeeds: [
  string,
  Department,
  string,
  boolean,
  Job["status"],
  string,
  number,
  number,
][] = [
  [
    "Senior Frontend Engineer",
    "Engineering",
    "Berlin",
    true,
    "open",
    "m_leo",
    120,
    150,
  ],
  [
    "Backend Engineer, Payments",
    "Engineering",
    "London",
    false,
    "open",
    "m_leo",
    110,
    140,
  ],
  ["Product Designer", "Design", "Remote (EU)", true, "open", "m_sam", 90, 115],
  [
    "Account Executive, Mid-Market",
    "Sales",
    "New York",
    false,
    "open",
    "m_noa",
    85,
    110,
  ],
  [
    "Product Manager, Growth",
    "Product",
    "Amsterdam",
    true,
    "open",
    "m_ava",
    105,
    130,
  ],
  [
    "Customer Success Manager",
    "Customer Success",
    "Toronto",
    false,
    "open",
    "m_noa",
    70,
    90,
  ],
  [
    "Content Marketing Lead",
    "Marketing",
    "Remote (US)",
    true,
    "draft",
    "m_ava",
    80,
    100,
  ],
  [
    "People Operations Partner",
    "People",
    "London",
    false,
    "closed",
    "m_ava",
    65,
    80,
  ],
];

const first = [
  "Olivia",
  "Liam",
  "Emma",
  "Noah",
  "Amara",
  "Kenji",
  "Sofia",
  "Mateo",
  "Priya",
  "Lucas",
  "Zara",
  "Elias",
  "Hana",
  "Omar",
  "Ingrid",
  "Diego",
  "Chloe",
  "Arjun",
  "Freya",
  "Jonas",
  "Nadia",
  "Theo",
  "Yuki",
  "Malik",
  "Clara",
  "Felix",
  "Leila",
  "Hugo",
  "Maya",
  "Kofi",
];
const last = [
  "Andersson",
  "Kim",
  "Moreau",
  "Silva",
  "Nguyen",
  "Fischer",
  "Rossi",
  "Haddad",
  "Kowalski",
  "Dubois",
  "Mensah",
  "Larsen",
  "Costa",
  "Ibrahim",
  "Novak",
  "Sato",
  "Walsh",
  "Romero",
  "Bauer",
  "Chen",
];
const companies = [
  "Northwind",
  "Globex",
  "Initech",
  "Umbrella Labs",
  "Hooli",
  "Vandelay",
  "Stark Digital",
  "Wayne Systems",
  "Acme Cloud",
  "Pied Piper",
];
const titles: Record<Department, string[]> = {
  Engineering: [
    "Software Engineer",
    "Senior Developer",
    "Full-stack Engineer",
    "Platform Engineer",
  ],
  Design: ["UX Designer", "Visual Designer", "Product Designer"],
  Product: ["Product Manager", "Associate PM", "Product Owner"],
  Sales: ["Account Executive", "SDR Lead", "Sales Manager"],
  Marketing: ["Content Strategist", "Marketing Manager"],
  "Customer Success": ["CSM", "Support Lead", "Onboarding Specialist"],
  People: ["HR Generalist", "People Partner"],
};
const tagPool = [
  "Visa needed",
  "Strong portfolio",
  "Ex-founder",
  "Relocating",
  "Silver medalist",
  "Fast track",
  "Part-time ok",
];
const noteBodies = [
  "Great communicator, clear on motivations.",
  "Salary expectation above band — flag to hiring manager.",
  "Available from next month.",
  "Asked about remote policy and equity.",
  "Referred by Leo, worked together before.",
];

export function createSeed(): AppState {
  const r = rng(42);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const jobs: Job[] = jobSeeds.map(
    ([title, department, location, remote, status, hm, min, max], i) => ({
      id: `job_${i + 1}`,
      title,
      department,
      location,
      remote,
      type: i === 6 ? "Contract" : "Full-time",
      status,
      hiringManagerId: hm,
      openedAt: daysAgo(10 + i * 9),
      salaryMin: min * 1000,
      salaryMax: max * 1000,
      description: `We're hiring a ${title} to join the ${department} team. You'll own meaningful work from day one and partner closely with cross-functional peers.`,
      questions: [
        "Why are you interested in Crewline?",
        "What's your notice period?",
      ],
    }),
  );

  const candidates: Candidate[] = [];
  for (let i = 0; i < 84; i++) {
    const job = jobs[i % 7 === 6 ? 7 : i % 6];
    const name = `${first[i % first.length]} ${last[(i * 7 + Math.floor(i / first.length) * 3) % last.length]}`;
    const stageRoll = r();
    const stage =
      STAGES[
        stageRoll < 0.38
          ? 0
          : stageRoll < 0.62
            ? 1
            : stageRoll < 0.84
              ? 2
              : stageRoll < 0.95
                ? 3
                : 4
      ];
    const tags = r() < 0.4 ? [pick(tagPool)] : [];
    candidates.push({
      id: `cand_${i + 1}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@mail.example`,
      phone: `+1 555 0${String(100 + i).padStart(3, "0")}`,
      location: pick([
        "Berlin",
        "London",
        "Lisbon",
        "New York",
        "Toronto",
        "Paris",
        "Remote",
      ]),
      currentTitle: pick(titles[job.department]),
      currentCompany: pick(companies),
      jobId: job.id,
      stage,
      rejected: stage !== "hired" && r() < 0.12,
      source: pick(SOURCES),
      tags,
      rating: Math.floor(r() * 6),
      appliedAt: daysAgo(Math.floor(r() * 60)),
      notes:
        r() < 0.5
          ? [
              {
                id: `n_${i}`,
                author: pick(members).name,
                at: daysAgo(Math.floor(r() * 10)),
                body: pick(noteBodies),
              },
            ]
          : [],
      scorecards:
        stage === "interview" || stage === "offer" || stage === "hired"
          ? [
              {
                id: `s_${i}`,
                interviewer: pick(members.slice(3)).name,
                rating: 3 + Math.floor(r() * 3),
                recommendation: r() < 0.7 ? "yes" : "strong_yes",
                comment: "Solid fundamentals and good collaboration signals.",
                at: daysAgo(Math.floor(r() * 14)),
              },
            ]
          : [],
    });
  }

  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const interviews: Interview[] = candidates
    .filter(
      (c) => !c.rejected && (c.stage === "screen" || c.stage === "interview"),
    )
    .slice(0, 16)
    .map((c, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + (i % 5) + (i >= 10 ? 7 : 0));
      d.setHours(9 + ((i * 3) % 8), i % 2 ? 30 : 0, 0, 0);
      return {
        id: `int_${i + 1}`,
        candidateId: c.id,
        interviewerIds: [
          members[3 + (i % 3)].id,
          ...(i % 3 === 0 ? [members[1].id] : []),
        ],
        start: d.toISOString(),
        durationMin: c.stage === "screen" ? 30 : 60,
        kind:
          c.stage === "screen" ? "Phone screen" : INTERVIEW_KINDS[1 + (i % 4)],
        location:
          c.stage === "screen"
            ? "Phone"
            : i % 2
              ? "Google Meet"
              : "Office — Room 2",
      };
    });

  return {
    jobs,
    candidates,
    interviews,
    members,
    settings: {
      companyName: "Crewline",
      userName: "Ava Lindqvist",
      theme: "light",
      notifyNewApplicant: true,
      notifyScorecard: true,
      notifyDigest: false,
      rejectTemplate:
        "Hi {{first_name}},\n\nThank you for your interest in the {{job_title}} role. After careful consideration we've decided to move forward with other candidates.\n\nBest,\n{{sender}}",
    },
  };
}
