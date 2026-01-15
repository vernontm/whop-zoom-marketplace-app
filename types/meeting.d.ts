export interface Meeting {
  id: string;
  zoom_meeting_id: string;
  zoom_password?: string; // Database field name
  password?: string; // Alias for compatibility
  title: string;
  description?: string;
  host_id: string;
  scheduled_at?: string;
  status: 'scheduled' | 'live' | 'ended';
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
}

export interface CreateMeetingRequest {
  zoom_meeting_id: string;
  zoom_password?: string;
  title: string;
  description?: string;
  scheduled_at?: string;
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  scheduled_at?: string;
  status?: 'scheduled' | 'live' | 'ended';
}
