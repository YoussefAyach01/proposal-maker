import type { Freelancer, Proposal } from "./proposal";

const KEY_PROPOSALS = "proposal-maker:proposals:v1";
const KEY_FREELANCER = "proposal-maker:freelancer:v1";

export const emptyFreelancer: Freelancer = {
  name: "",
  tagline: "",
  email: "",
  phone: "",
  address: "",
  website: "",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadProposals = () => read<Proposal[]>(KEY_PROPOSALS, []);
export const saveProposals = (v: Proposal[]) => write(KEY_PROPOSALS, v);
export const loadFreelancer = () => ({
  ...emptyFreelancer,
  ...read<Partial<Freelancer>>(KEY_FREELANCER, {}),
});
export const saveFreelancer = (v: Freelancer) => write(KEY_FREELANCER, v);
