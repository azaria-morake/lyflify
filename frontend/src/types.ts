export interface Patient {
  id: string; // Firestore Document ID
  patient_id: string; // The ID entered by the user (e.g. "demo_user")
  
  // Handling inconsistent naming between Seed data ('name') and Booking data ('patient_name')
  name?: string; 
  patient_name?: string;
  
  // Triage Data
  score: string | number; // e.g. "High (8/10)" or 8
  status: 'Waiting' | 'Pending Approval' | 'Confirmed' | 'Cancelled' | 'Delayed' | 'Emergency En Route' | string;
  urgent: boolean;
  symptoms: string;
  
  // Timestamps
  time: string; // Display time e.g. "08:15"
  created_at: string; // ISO String
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
