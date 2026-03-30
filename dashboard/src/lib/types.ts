export type UserRole = "super_admin" | "mla" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  is_active: boolean;
}

export type GrievanceCategory =
  | "road"
  | "water"
  | "electricity"
  | "sanitation"
  | "safety"
  | "education"
  | "health"
  | "other";
export type GrievancePriority = "high" | "medium" | "low";
export type GrievanceStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected";

export interface Grievance {
  grievance_id: string;
  citizen_name: string;
  citizen_phone: string;
  category: GrievanceCategory;
  description: string;
  ward_id: string;
  assigned_dept: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  created_date: string;
  resolved_date?: string;
  resolution_note?: string;
  created_by: string;
  assigned_to?: string;
}

export type ProjectStatus = "completed" | "running" | "pending" | "on_hold";

export interface Project {
  project_id: string;
  project_name: string;
  category: string;
  department: string;
  contractor_name: string;
  ward_id: string;
  start_date: string;
  end_date: string;
  budget_sanctioned: number;
  budget_released: number;
  budget_used: number;
  status: ProjectStatus;
  completion_percentage: number;
  description: string;
}

export type InstitutionCategory =
  | "temple"
  | "hospital"
  | "school"
  | "college"
  | "police_station"
  | "govt_office"
  | "ngo"
  | "gym"
  | "market"
  | "slum"
  | "rwa"
  | "club"
  | "sports_ground"
  | "university"
  | "coaching_center"
  | "old_age_home"
  | "dispensary";
export type InstitutionStatus =
  | "active"
  | "inactive"
  | "under_maintenance"
  | "closed"
  | "proposed";

export interface Institution {
  institution_id: string;
  name: string;
  inst_category: InstitutionCategory;
  address: string;
  ward_id: string;
  official_contact_no: string;
  email?: string;
  status: InstitutionStatus;
  established_year?: number;
  website?: string;
  notes?: string;
}

export type AreaType = "urban" | "rural" | "semi-urban";

export interface Area {
  area_id: string;
  area_name: string;
  area_type: AreaType;
  population: number;
  ward_id: string;
  pincode: string;
  landmark?: string;
  households: number;
}

export interface Ward {
  ward_id: string;
  ward_name: string;
  ward_number: number;
  population: number;
  area_type: AreaType;
  zone: string;
  councillor_name: string;
  councillor_phone: string;
  total_households: number;
  status: "active" | "inactive" | "proposed";
  created_date: string;
  description?: string;
}

// export interface Scheme {
//   scheme_id: string;
//   name: string;
//   department: string;
//   target_beneficiaries: number;
//   current_beneficiaries: number;
//   budget: number;
//   status: string;
//   ward_id: string;
//   description: string;
//   start_date: string;
//   end_date: string;
// }

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  is_read: boolean;
  created_at: string;
}
