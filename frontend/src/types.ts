export interface Patient {
  id: string; // Firestore Document ID
  patient_id: string; // The ID entered by the user (e.g. "demo_user")
  
  // Handling inconsistent naming between Seed data ('name') and Booking data ('patient_name')
  name?: string; 
  patient_name?: string;
  
  // New Fields for Doctor Assignment
  doctor_id?: string;
  doctor_name?: string;
  
  // Triage Data
  score: string | number; // e.g. "High (8/10)" or 8
  status: 'Waiting' | 'Pending Approval' | 'Confirmed' | 'Cancelled' | 'Delayed' | 'Emergency En Route' | 'Waiting for Doctor' | 'In Review' | string;
  urgent: boolean;
  symptoms: string;
  
  // Timestamps & AI Schedule
  time: string; // Display time e.g. "08:15"
  created_at: string; // ISO String
  transcript?: string; // Full chat transcript for manual verification
  schedule?: VisitSchedule;
}

export interface VisitSchedule {
  arrival_time: string;
  vitals_time: string;
  doctor_time: string;
  medication_pickup_time: string;
  appointment_date: string;
  interim_notes: string;
  what_to_bring: string[];
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  type: 'time' | 'users' | 'alert' | 'activity';
}

export interface AnalyticsData {
  metrics: Metric[];
  hourly_traffic: { time: string; patients: number }[];
  diagnosis_data: { name: string; value: number; color: string }[];
}