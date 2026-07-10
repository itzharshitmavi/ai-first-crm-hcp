export type ToolName =
  | 'log_interaction'
  | 'edit_interaction'
  | 'fetch_hcp_context'
  | 'recommend_next_best_action'
  | 'draft_follow_up'

export interface Hcp {
  id: number
  full_name: string
  specialty: string
  institution: string
  territory: string
  preferred_channel: string
  relationship_stage: string
  last_interaction_at: string | null
}

export interface Interaction {
  id: number
  hcp_name: string
  specialty: string
  institution: string
  interaction_type: string
  interaction_date: string
  interaction_time: string
  attendees: string[]
  objective: string
  summary: string
  sentiment: string
  products_discussed: string[]
  materials_shared: string[]
  samples_distributed: string[]
  next_step: string
  follow_up_date: string
  raw_notes: string
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  reply: string
  tool_name: ToolName | null
  tool_result: Record<string, unknown> | null
}

export interface InteractionBoardState {
  interactionId: number | null
  hcpName: string
  hcpSpecialty: string
  hcpInstitution: string
  hcpTerritory: string
  channel: string
  interactionAt: string
  sentiment: string
  objective: string
  rawNotes: string
  summary: string
  nextStep: string
  followUpDate: string
  productsDiscussed: string
}

export interface LogInteractionDraft {
  interactionId: number | null
  hcpName: string
  specialty: string
  institution: string
  interactionType: string
  interactionDate: string
  interactionTime: string
  attendees: string[]
  objective: string
  summary: string
  sentiment: string
  productsDiscussed: string[]
  materialsShared: string[]
  samplesDistributed: string[]
  nextStep: string
  followUpDate: string
  rawNotes: string
}

export interface ToolRun {
  toolName: ToolName
  result: Record<string, unknown>
  timestamp: string
}

export interface HcpOption {
  id: string
  name: string
  specialty: string
  institution: string
  territory: string
}

export interface InteractionFormValues {
  hcpName: string
  hcpSpecialty: string
  hcpInstitution: string
  interactionType: 'Meeting' | 'Call' | 'Email' | 'Conference' | 'Visit'
  date: string
  time: string
  attendees: string[]
  topicsDiscussed: string
  materialsShared: string[]
  samplesDistributed: string[]
  sentiment: 'Positive' | 'Neutral' | 'Negative'
  outcomes: string
  followUpActions: string
  aiSuggestedFollowups: string[]
}

export interface AssistantResponsePayload {
 hcp_name?: string
  specialty?: string
  institution?: string
  interaction_type?: InteractionFormValues['interactionType']
  interaction_date?: string
  interaction_time?: string
  attendees?: string[]

  summary?: string             
  next_step?: string           

  products_discussed?: string[] 
  materials_shared?: string[]
  samples_distributed?: string[]

  sentiment?: InteractionFormValues['sentiment']

  raw_notes?: string            
  follow_up_date?: string    

  ai_suggested_followups?: string[]
}