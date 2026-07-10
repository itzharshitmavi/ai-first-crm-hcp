import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createInteraction, sendChat } from '../services/api'
import type { ChatResponse, Interaction, LogInteractionDraft } from '../types'

export interface ChatMessage {
  role: 'assistant' | 'user'
  content: string
}

interface CrmState {
  messages: ChatMessage[]
  isAssistantLoading: boolean
  isSaving: boolean
  saveNote: string | null
  lastSavedInteraction: Interaction | null
}

const initialState: CrmState = {
  messages: [],
  isAssistantLoading: false,
  isSaving: false,
  saveNote: null,
  lastSavedInteraction: null,
}

// Sends a chat message to the LangGraph agent backend and returns the reply
// plus any structured tool_result the caller can use to populate the form.
export const sendAssistantMessage = createAsyncThunk<ChatResponse, string>(
  'crm/sendAssistantMessage',
  async (message) => {
    const response = await sendChat(message)
    return response
  },
)

// Persists a reviewed/edited interaction to the backend.
export const saveInteraction = createAsyncThunk<Interaction, LogInteractionDraft>(
  'crm/saveInteraction',
  async (draft) => {
    const result = await createInteraction(draft)
    return result
  },
)

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    setSaveNote(state, action: PayloadAction<string | null>) {
      state.saveNote = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendAssistantMessage.pending, (state, action) => {
        state.isAssistantLoading = true
        state.messages.push({ role: 'user', content: action.meta.arg })
      })
      .addCase(sendAssistantMessage.fulfilled, (state, action) => {
        state.isAssistantLoading = false
        state.messages.push({ role: 'assistant', content: action.payload.reply })
      })
      .addCase(sendAssistantMessage.rejected, (state, action) => {
        state.isAssistantLoading = false
        state.messages.push({
          role: 'assistant',
          content: action.error.message ?? 'Unable to reach the assistant.',
        })
      })
      .addCase(saveInteraction.pending, (state) => {
        state.isSaving = true
        state.saveNote = null
      })
      .addCase(saveInteraction.fulfilled, (state, action) => {
        state.isSaving = false
        state.lastSavedInteraction = action.payload
        state.saveNote = 'Interaction saved successfully.'
      })
      .addCase(saveInteraction.rejected, (state) => {
        state.isSaving = false
        state.saveNote = 'Failed to save interaction.'
      })
  },
})

export const { setSaveNote } = crmSlice.actions
export default crmSlice.reducer