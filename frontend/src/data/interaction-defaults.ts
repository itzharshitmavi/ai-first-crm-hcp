import type { InteractionFormValues } from '../types'

export const interactionDefaults: InteractionFormValues = {
  hcpName: '',
  interactionType: 'Meeting',
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  attendees: [],
  topicsDiscussed: '',
  materialsShared: [],
  samplesDistributed: [],
  sentiment: 'Neutral',
  outcomes: '',
  followUpActions: '',
  aiSuggestedFollowups: ['Schedule follow-up meeting in 2 weeks', 'Send Oncology Phase II PDF', 'Add Dr. Sharma to advisory board invite list'],
}
