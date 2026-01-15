export interface ZoomSignatureRequest {
  meetingNumber: string;
  role: 0 | 1; // 0 = attendee, 1 = host
}

export interface ZoomSignatureResponse {
  signature: string;
}

export interface ZoomMeetingConfig {
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail: string;
  role: 0 | 1;
}

export interface ZoomClient {
  join: (config: ZoomMeetingConfig) => Promise<void>;
  leave: () => void;
  getCurrentUser: () => any;
  getParticipantsClient: () => any;
  getChatClient: () => any;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
  init: (config: { zoomAppRoot: HTMLElement; language?: string; patchJsMedia?: boolean }) => Promise<void>;
}
