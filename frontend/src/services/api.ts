import axios from 'axios'
import type { ChatResponse, Interaction, LogInteractionDraft, ToolName } from '../types'

const api = axios.create({
  baseURL: '/api',
})

export interface DashboardPayload {
  interactions: Interaction[]
}

export async function fetchDashboard() {
  const response = await api.get<DashboardPayload>('/dashboard')
  return response.data
}

export async function createInteraction(draft: LogInteractionDraft) {
  const response = await api.post<Interaction>('/interactions', {
    hcp_name: draft.hcpName,
    specialty: draft.specialty,
    institution: draft.institution,
    interaction_type: draft.interactionType,
    interaction_date: draft.interactionDate,
    interaction_time: draft.interactionTime,
    attendees: draft.attendees,
    objective: draft.objective,
    summary: draft.summary,
    sentiment: draft.sentiment,
    products_discussed: draft.productsDiscussed,
    materials_shared: draft.materialsShared,
    samples_distributed: draft.samplesDistributed,
    next_step: draft.nextStep,
    follow_up_date: draft.followUpDate,
    raw_notes: draft.rawNotes,
  })
  return response.data
}

export async function updateInteraction(interactionId: number, updates: Partial<LogInteractionDraft>) {
  const response = await api.put<Interaction>(`/interactions/${interactionId}`, {
    hcp_name: updates.hcpName,
    specialty: updates.specialty,
    institution: updates.institution,
    interaction_type: updates.interactionType,
    interaction_date: updates.interactionDate,
    interaction_time: updates.interactionTime,
    attendees: updates.attendees,
    objective: updates.objective,
    summary: updates.summary,
    sentiment: updates.sentiment,
    products_discussed: updates.productsDiscussed,
    materials_shared: updates.materialsShared,
    samples_distributed: updates.samplesDistributed,
    next_step: updates.nextStep,
    follow_up_date: updates.followUpDate,
    raw_notes: updates.rawNotes,
  })
  return response.data
}

export async function sendChat(message: string, hcpId?: number, interactionId?: number) {
  const response = await api.post<ChatResponse>('/agent/chat', {
    message,
    hcp_id: hcpId ?? null,
    interaction_id: interactionId ?? null,
  })
  return response.data
}

export async function runTool(toolName: ToolName, payload: Record<string, unknown>) {
  const response = await api.post<{ tool_name: ToolName; result: Record<string, unknown> }>('/tools/demo', {
    tool_name: toolName,
    payload,
  })
  return response.data
}