/**
 * The only module that knows how job listings are sourced.
 *
 * The current provider is intentionally a small, clearly labeled fixture
 * dataset for the hackathon preview. Replace DemoJobProvider with an adapter
 * for a future public job API here; routes and frontend use only this contract.
 * Keep API credentials server-side and map provider fields into JobListing.
 */
export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";
export type JobSort = "relevance" | "recent";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  state: string | null;
  city: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: EmploymentType;
  shortDescription: string;
  description: string;
  requiredSkills: string[];
  externalUrl: string | null;
  datePosted: string;
  companyInfo: string;
  demo: boolean;
}

export interface JobFilters {
  page: number;
  limit: number;
  q?: string;
  minSalary?: number;
  maxSalary?: number;
  state?: string;
  city?: string;
  remote?: boolean;
  employmentType?: EmploymentType;
  sort: JobSort;
}

export interface JobPage {
  jobs: JobListing[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobMatchScore {
  jobId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  skillsConsidered: number;
}

export interface JobProvider {
  listJobs(filters: JobFilters): Promise<JobPage>;
  getJobDetails(id: string): Promise<JobListing | null>;
  matchJobs(candidateSkills: string[], jobIds?: string[]): Promise<JobMatchScore[]>;
}

// Illustrative records only; they are not active vacancies. Missing apply URLs
// are deliberate: never direct a user to an invented or unrelated listing.
const DEMO_JOBS: JobListing[] = [
  {
    id: "demo-data-analyst",
    title: "Data Analyst",
    company: "Northstar Analytics (sample)",
    location: "Kuala Lumpur, Malaysia",
    state: "Kuala Lumpur",
    city: "Kuala Lumpur",
    remote: false,
    salaryMin: 5000,
    salaryMax: 7500,
    employmentType: "full-time",
    shortDescription: "Turn business questions into clear analysis, reports, and dashboards.",
    description:
      "Illustrative demo listing. Work with stakeholders to define metrics, analyze structured datasets, and share findings through clear reports and dashboards. A real listing and application destination will be supplied by a future job provider.",
    requiredSkills: ["SQL", "Excel", "Python", "Power BI", "Data Analysis", "Communication"],
    externalUrl: null,
    datePosted: "2026-10-20",
    companyInfo: "Fictional sample organization used to demonstrate the job-search interface.",
    demo: true,
  },
  {
    id: "demo-software-engineer",
    title: "Software Engineer",
    company: "Harbor Labs (sample)",
    location: "Petaling Jaya, Selangor",
    state: "Selangor",
    city: "Petaling Jaya",
    remote: true,
    salaryMin: 7000,
    salaryMax: 11000,
    employmentType: "full-time",
    shortDescription: "Build and maintain web services with a small product team.",
    description:
      "Illustrative demo listing. Contribute to API design, code reviews, automated testing, and reliable deployments. A real listing and application destination will be supplied by a future job provider.",
    requiredSkills: ["TypeScript", "Node.js", "SQL", "Git", "Docker", "Testing"],
    externalUrl: null,
    datePosted: "2026-10-19",
    companyInfo: "Fictional sample organization used to demonstrate the job-search interface.",
    demo: true,
  },
  {
    id: "demo-product-designer",
    title: "Product Designer",
    company: "Cedar Works (sample)",
    location: "George Town, Penang",
    state: "Penang",
    city: "George Town",
    remote: false,
    salaryMin: 4500,
    salaryMax: 7000,
    employmentType: "full-time",
    shortDescription: "Shape useful digital experiences through research and prototyping.",
    description:
      "Illustrative demo listing. Collaborate with product and engineering partners to understand user needs, prototype ideas, and improve interface usability. A real listing and application destination will be supplied by a future job provider.",
    requiredSkills: ["Figma", "User Research", "Prototyping", "Communication", "Accessibility"],
    externalUrl: null,
    datePosted: "2026-10-18",
    companyInfo: "Fictional sample organization used to demonstrate the job-search interface.",
    demo: true,
  },
  {
    id: "demo-cloud-intern",
    title: "Cloud Engineering Intern",
    company: "Meridian Systems (sample)",
    location: "Cyberjaya, Selangor",
    state: "Selangor",
    city: "Cyberjaya",
    remote: false,
    salaryMin: 1800,
    salaryMax: 2500,
    employmentType: "internship",
    shortDescription: "Learn cloud operations, automation, and deployment fundamentals.",
    description:
      "Illustrative demo listing. Assist with documentation, service monitoring, and simple infrastructure automation with support from experienced engineers. A real listing and application destination will be supplied by a future job provider.",
    requiredSkills: ["Linux", "Python", "AWS", "Git", "Communication"],
    externalUrl: null,
    datePosted: "2026-10-17",
    companyInfo: "Fictional sample organization used to demonstrate the job-search interface.",
    demo: true,
  },
  {
    id: "demo-hr-analyst",
    title: "People Insights Analyst",
    company: "Kindred People Co. (sample)",
    location: "Remote · Malaysia",
    state: null,
    city: null,
    remote: true,
    salaryMin: 6000,
    salaryMax: 8500,
    employmentType: "contract",
    shortDescription: "Help teams use workforce data to make informed people decisions.",
    description:
      "Illustrative demo listing. Analyze workforce trends, build reporting, and communicate findings with care for privacy and context. A real listing and application destination will be supplied by a future job provider.",
    requiredSkills: ["Excel", "SQL", "Data Analysis", "Data Visualization", "Communication"],
    externalUrl: null,
    datePosted: "2026-10-16",
    companyInfo: "Fictional sample organization used to demonstrate the job-search interface.",
    demo: true,
  },
  {
    id: "demo-support-part-time",
    title: "Customer Support Associate",
    company: "Daybreak Digital (sample)",
    location: "Johor Bahru, Johor",
    state: "Johor",
    city: "Johor Bahru",
    remote: false,
    salaryMin: 2500,
    salaryMax: 3500,
    employmentType: "part-time",
    shortDescription: "Support customers with clear, thoughtful product guidance.",
    description:
      "Illustrative demo listing. Respond to customer questions, document product feedback, and coordinate issue resolution. A real listing and application destination will be supplied by a future job provider.",
    requiredSkills: ["Communication", "Customer Research", "Problem Solving", "Documentation"],
    externalUrl: null,
    datePosted: "2026-10-15",
    companyInfo: "Fictional sample organization used to demonstrate the job-search interface.",
    demo: true,
  },
  {
    id: "demo-frontend",
    title: "Frontend Developer",
    company: "Orbit Studio (sample)",
    location: "Remote · Malaysia",
    state: null,
    city: null,
    remote: true,
    salaryMin: 6500,
    salaryMax: 9500,
    employmentType: "full-time",
    shortDescription: "Create accessible interfaces for web products.",
    description:
      "Illustrative demo listing. Build responsive web experiences, collaborate on component systems, and improve accessibility and performance. A real listing and application destination will be supplied by a future job provider.",
    requiredSkills: ["React", "TypeScript", "CSS", "Accessibility", "Git", "Testing"],
    externalUrl: null,
    datePosted: "2026-10-14",
    companyInfo: "Fictional sample organization used to demonstrate the job-search interface.",
    demo: true,
  },
  {
    id: "demo-marketing-analyst",
    title: "Marketing Data Analyst",
    company: "Saffron Digital (sample)",
    location: "Kuala Lumpur, Malaysia",
    state: "Kuala Lumpur",
    city: "Kuala Lumpur",
    remote: false,
    salaryMin: 4200,
    salaryMax: 6500,
    employmentType: "full-time",
    shortDescription: "Measure campaign performance and surface useful customer insights.",
    description:
      "Illustrative demo listing. Partner with marketing teams to analyze campaign results, maintain dashboards, and explain opportunities in accessible terms. A real listing and application destination will be supplied by a future job provider.",
    requiredSkills: ["SQL", "Excel", "Data Visualization", "Communication", "Analytics"],
    externalUrl: null,
    datePosted: "2026-10-13",
    companyInfo: "Fictional sample organization used to demonstrate the job-search interface.",
    demo: true,
  },
];

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

interface IndexedJob {
  job: JobListing;
  title: string;
  company: string;
  skills: string[];
  searchable: string;
  state: string;
  city: string;
}

// Normalized once so requests only compare prepared strings.
function indexJob(job: JobListing): IndexedJob {
  const title = normalize(job.title);
  const company = normalize(job.company);
  const skills = job.requiredSkills.map(normalize);
  return {
    job,
    title,
    company,
    skills,
    searchable: [title, company, ...skills].join(" "),
    state: normalize(job.state ?? ""),
    city: normalize(job.city ?? ""),
  };
}

export class DemoJobProvider implements JobProvider {
  private readonly indexed = DEMO_JOBS.map(indexJob);
  private readonly byId = new Map(this.indexed.map((entry) => [entry.job.id, entry]));

  async listJobs(filters: JobFilters): Promise<JobPage> {
    const query = normalize(filters.q ?? "");
    const queryTerms = query.split(" ").filter(Boolean);
    const state = filters.state ? normalize(filters.state) : null;
    const city = filters.city ? normalize(filters.city) : null;
    const matching = this.indexed.filter(({ job, searchable, ...fields }) => {
      if (!queryTerms.every((term) => searchable.includes(term))) return false;
      if (filters.minSalary !== undefined && (job.salaryMin === null || job.salaryMin < filters.minSalary)) return false;
      if (filters.maxSalary !== undefined && (job.salaryMin === null || job.salaryMin > filters.maxSalary)) return false;
      if (state !== null && fields.state !== state) return false;
      if (city !== null && fields.city !== city) return false;
      if (filters.remote !== undefined && job.remote !== filters.remote) return false;
      if (filters.employmentType && job.employmentType !== filters.employmentType) return false;
      return true;
    });

    const byRecent = (a: JobListing, b: JobListing) => b.datePosted.localeCompare(a.datePosted);
    let jobs: JobListing[];
    if (filters.sort === "relevance" && queryTerms.length) {
      // Score each job once rather than inside the sort comparator.
      jobs = matching
        .map((entry) => ({
          job: entry.job,
          relevance: queryTerms.reduce(
            (score, term) => score + (entry.title.includes(term) ? 3 : 0) + (entry.company.includes(term) ? 2 : 0) +
              (entry.skills.some((skill) => skill.includes(term)) ? 1 : 0),
            0,
          ),
        }))
        .sort((a, b) => b.relevance - a.relevance || byRecent(a.job, b.job))
        .map((entry) => entry.job);
    } else {
      jobs = matching.map((entry) => entry.job).sort(byRecent);
    }

    const total = jobs.length;
    const start = (filters.page - 1) * filters.limit;
    return {
      jobs: jobs.slice(start, start + filters.limit),
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async getJobDetails(id: string): Promise<JobListing | null> {
    return this.byId.get(id)?.job ?? null;
  }

  async matchJobs(candidateSkills: string[], jobIds?: string[]): Promise<JobMatchScore[]> {
    const candidate = new Set(candidateSkills.map(normalize).filter(Boolean));
    const selected = jobIds ? new Set(jobIds) : null;
    return this.indexed.filter(({ job }) => !selected || selected.has(job.id)).map(({ job, skills }) => {
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];
      skills.forEach((skill, i) => (candidate.has(skill) ? matchedSkills : missingSkills).push(job.requiredSkills[i]));
      return {
        jobId: job.id,
        score: skills.length ? Math.round((matchedSkills.length / skills.length) * 100) : 0,
        matchedSkills,
        missingSkills,
        skillsConsidered: skills.length,
      };
    });
  }
}

// Keep frontend and route code provider-agnostic. Replace this binding with a
// real public API adapter when its documentation and credentials are available.
export const jobProvider: JobProvider = new DemoJobProvider();
