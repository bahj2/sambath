export enum AppView {
  DASHBOARD = 'DASHBOARD',
  VIDEO_TRANSLATOR = 'VIDEO_TRANSLATOR',
  LIVE_VOICE = 'LIVE_VOICE',
  VIDEO_GEN = 'VIDEO_GEN',
  VEO3_VIDEO_GEN = 'VEO3_VIDEO_GEN',
  TRANSLATOR = 'TRANSLATOR',
  VIDEO_INSIGHTS = 'VIDEO_INSIGHTS',
  SPEECH_SYNTH = 'SPEECH_SYNTH',
  SPEECH_TO_TEXT = 'SPEECH_TO_TEXT',
  SPEECH_TO_SPEECH = 'SPEECH_TO_SPEECH',
  KHMER_VOICE = 'KHMER_VOICE',
  VOICE_CLONE = 'VOICE_CLONE',
  BUILD = 'BUILD',
  PREMIUM = 'PREMIUM',
  // New features
  IMAGE_GEN = 'IMAGE_GEN',
  DOCUMENT_AI = 'DOCUMENT_AI',
  API_HUB = 'API_HUB',
  SETTINGS = 'SETTINGS',
  VIDEO_TO_KHMER = 'VIDEO_TO_KHMER',
  WATERMARK_REMOVER = 'WATERMARK_REMOVER',
  IMAGE_WATERMARK_REMOVER = 'IMAGE_WATERMARK_REMOVER',
  VIDEO_UNDERSTANDING = 'VIDEO_UNDERSTANDING',
  ADMIN = 'ADMIN',
  KLING_VIDEO_GEN = 'KLING_VIDEO_GEN'
}

export interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface FeatureCard {
  title: string;
  description: string;
  id: AppView;
  gradient: string;
  icon: React.ReactNode;
  tag?: string;
  isNew?: boolean;
  isPro?: boolean;
}