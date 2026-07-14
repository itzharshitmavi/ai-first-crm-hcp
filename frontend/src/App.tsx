import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {Loader2, Mic,
  Plus,
  Search,
  Send,
  Sparkles
} from 'lucide-react'
import {dummyHcps, materialSuggestions, sampleSuggestions } from './data/hcps'
import { interactionDefaults } from './data/interaction-defaults'
import { SearchableHcpSelect } from './components/searchable-hcp-select'
import { MultiValueInput } from './components/multi-value-input'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { FormField } from './components/ui/form-field'
import { Input } from './components/ui/input'
import { Radio } from './components/ui/radio-group'
import { ScrollArea } from './components/ui/scroll-area'
import { Separator } from './components/ui/separator'
import { Select } from './components/ui/select'
import { Textarea } from './components/ui/textarea'
import { cn } from './lib/utils'
import type { AssistantResponsePayload, InteractionFormValues } from './types'
import { useAppDispatch, useAppSelector } from './hooks'
import { saveInteraction, sendAssistantMessage, setSaveNote } from './features/crmSlice'

const interactionTypes: InteractionFormValues['interactionType'][] = ['Meeting', 'Call', 'Email', 'Conference', 'Visit']
const sentiments: InteractionFormValues['sentiment'][] = ['Positive', 'Neutral', 'Negative']

function App() {
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state) => state.crm.messages)
  const isAssistantLoading = useAppSelector((state) => state.crm.isAssistantLoading)
  const isSaving = useAppSelector((state) => state.crm.isSaving)
  const saveNote = useAppSelector((state) => state.crm.saveNote)

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<InteractionFormValues>({
    mode: 'onChange',
    defaultValues: interactionDefaults,
  })

  const [chatInput, setChatInput] = useState('')
  const [materialsOpen, setMaterialsOpen] = useState(false)
  const [samplesOpen, setSamplesOpen] = useState(false)

  const values = watch()

  const suggestedFollowUps = useMemo(
    () => values.aiSuggestedFollowups.length > 0 ? values.aiSuggestedFollowups : interactionDefaults.aiSuggestedFollowups,
    [values.aiSuggestedFollowups],
  )

 const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

 const populateFromAssistant = (payload: AssistantResponsePayload) => {

  const opts = { shouldDirty: true, shouldValidate: true, shouldTouch: true } as const

  if (payload.hcp_name) {
    setValue("hcpName", payload.hcp_name, opts)
  }

  if (payload.specialty) {
    setValue("hcpSpecialty", payload.specialty, opts)
  }

  if (payload.institution) {
    setValue("hcpInstitution", payload.institution, opts)
  }

  if (payload.interaction_type) {
    setValue("interactionType", payload.interaction_type, opts)
  }

  if (payload.interaction_date) {
    setValue("date", payload.interaction_date, opts)
  }

  if (payload.interaction_time) {
    setValue("time", payload.interaction_time, opts)
  }

  if (payload.attendees) {
    setValue("attendees", asStringArray(payload.attendees), opts)
  }

  if (payload.summary) {
    setValue("topicsDiscussed", payload.summary, opts)
  }

  if (payload.materials_shared) {
    setValue("materialsShared", asStringArray(payload.materials_shared), opts)
  }

  if (payload.samples_distributed) {
    setValue("samplesDistributed", asStringArray(payload.samples_distributed), opts)
  }

  if (payload.sentiment) {
    setValue("sentiment", payload.sentiment, opts)
  }

  if (payload.summary) {
    setValue("outcomes", payload.summary, opts)
  }

  if (payload.next_step) {
    setValue("followUpActions", payload.next_step, opts)
  }

}

  const handleAssistantSubmit = async () => {
    const prompt = chatInput.trim()
    if (!prompt) {
      return
    }

    setChatInput('')

    const result = await dispatch(sendAssistantMessage(prompt))
    if (sendAssistantMessage.fulfilled.match(result)) {
      const response = result.payload
      if (response.tool_result) {
        populateFromAssistant(response.tool_result as AssistantResponsePayload)
        await trigger()
      }
    }
  }

  const onSave = async (formValues: InteractionFormValues) => {
    const hcpName = formValues.hcpName.trim()

    if (!hcpName) {
      dispatch(setSaveNote("Please enter or select an HCP name."))
      return
    }

    await dispatch(
      saveInteraction({
        interactionId: null,
        hcpName,
        specialty: formValues.hcpSpecialty?.trim() || 'Not specified',
        institution: formValues.hcpInstitution?.trim() || 'Not specified',
        interactionType: formValues.interactionType,
        interactionDate: formValues.date,
        interactionTime: formValues.time,
        attendees: formValues.attendees,
        objective: formValues.topicsDiscussed,
        summary: formValues.outcomes,
        sentiment: formValues.sentiment,
        productsDiscussed: formValues.materialsShared,
        materialsShared: formValues.materialsShared,
        samplesDistributed: formValues.samplesDistributed,
        nextStep: formValues.followUpActions,
        followUpDate: '',
        rawNotes: formValues.topicsDiscussed,
      }),
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] px-6 py-6 text-slate-900">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <header className="flex flex-col gap-2">
          
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">Log HCP Interaction</h1>
         
        </header>

        <div className="grid min-h-[calc(100vh-160px)] grid-cols-1 gap-6 lg:grid-cols-[7fr_3fr] xl:grid-cols-[3fr_1fr]">
          <Card className="flex h-full flex-col bg-white">
            <CardHeader className="border-b border-[#E5E7EB] px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-[18px]">Interaction Details</CardTitle>
                 
                </div>
               
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-6 px-6 py-6">
              <form className="flex flex-1 flex-col gap-6" onSubmit={handleSubmit(onSave)}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="HCP Name" required>
                    <Controller
                      control={control}
                      name="hcpName"
                      rules={{ required: 'HCP Name is required' }}
                      render={({ field }) => (
                        <SearchableHcpSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={dummyHcps}
                          placeholder="Search or select HCP..."
                        />
                      )}
                    />
                    {errors.hcpName ? <p className="text-xs text-rose-500">{errors.hcpName.message}</p> : null}
                  </FormField>

                  <FormField label="Interaction Type" required>
                    <Controller
                      control={control}
                      name="interactionType"
                      rules={{ required: 'Interaction Type is required' }}
                      render={({ field }) => (
                        <Select {...field}>
                          {interactionTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.interactionType ? <p className="text-xs text-rose-500">{errors.interactionType.message}</p> : null}
                  </FormField>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="Date" required>
                    <Input {...register('date', { required: 'Date is required' })} type="date" />
                    {errors.date ? <p className="text-xs text-rose-500">{errors.date.message}</p> : null}
                  </FormField>

                  <FormField label="Time">
                    <Input {...register('time')} type="time" />
                  </FormField>
                </div>

                <FormField label="Attendees">
                  <MultiValueInput
                    label=""
                    placeholder="Enter names or search..."
                    values={values.attendees}
                    onChange={(nextValues) => setValue('attendees', nextValues, { shouldDirty: true, shouldValidate: true })}
                  
                    
                  />
                </FormField>

                <FormField label="Topics Discussed" required>
                  <div className="relative">
                    <Textarea
                      {...register('topicsDiscussed', { required: 'Topics discussed is required' })}
                      className="min-h-[120px] pr-12 pb-10"
                      placeholder="Enter key discussion points..."
                    />
                    <button
                      type="button"
                      className="absolute bottom-3 right-3 rounded-full border border-[#E5E7EB] bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50"
                      aria-label="Record voice note"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.topicsDiscussed ? <p className="text-xs text-rose-500">{errors.topicsDiscussed.message}</p> : null}
                  <Button type="button" variant="outline" className="w-fit gap-2 text-slate-700">
                    <Sparkles className="h-4 w-4" />
                    Summarize from Voice Note (Requires Consent)
                  </Button>
                </FormField>

                <Separator />

                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900">Materials Shared / Samples Distributed</h3>
                      <p className="mt-1 text-[13px] text-slate-500">Track supporting assets shared during the visit.</p>
                    </div>
                  </div>

                  <Card className="border-[#E5E7EB] shadow-sm">
                    <CardContent className="grid gap-4 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[14px] font-medium text-slate-900">Materials Shared</p>
                          <p className="text-[13px] text-slate-500">{values.materialsShared.length === 0 ? 'No materials added.' : values.materialsShared.join(', ')}</p>
                        </div>
                        <Button type="button" variant="outline" className="gap-2" onClick={() => setMaterialsOpen((current) => !current)}>
                          <Search className="h-4 w-4" />
                          Search/Add
                        </Button>
                      </div>
                      {materialsOpen ? (
                        <MultiValueInput
                          label=""
                          placeholder="Add materials..."
                          values={values.materialsShared}
                          onChange={(nextValues) => setValue('materialsShared', nextValues, { shouldDirty: true, shouldValidate: true })}
                          suggestions={materialSuggestions}
                        />
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card className="border-[#E5E7EB] shadow-sm">
                    <CardContent className="grid gap-4 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[14px] font-medium text-slate-900">Samples Distributed</p>
                          <p className="text-[13px] text-slate-500">{values.samplesDistributed.length === 0 ? 'No samples added.' : values.samplesDistributed.join(', ')}</p>
                        </div>
                        <Button type="button" variant="outline" className="gap-2" onClick={() => setSamplesOpen((current) => !current)}>
                          <Plus className="h-4 w-4" />
                          Add Sample
                        </Button>
                      </div>
                      {samplesOpen ? (
                        <MultiValueInput
                          label=""
                          placeholder="Add samples..."
                          values={values.samplesDistributed}
                          onChange={(nextValues) => setValue('samplesDistributed', nextValues, { shouldDirty: true, shouldValidate: true })}
                          suggestions={sampleSuggestions}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="grid gap-3">
                  <span className="text-[13px] font-medium text-slate-700">Observed/Inferenced HCP Sentiment</span>
                  <div className="flex flex-wrap gap-6">
                    {sentiments.map((sentiment) => (
                      <label key={sentiment} className="flex items-center gap-2 text-[14px] text-slate-700">
                        <Radio {...register('sentiment')} value={sentiment} defaultChecked={sentiment === 'Neutral'} />
                        {sentiment}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <FormField label="Outcomes">
                    <Textarea
                      {...register('outcomes')}
                      className="min-h-[90px]"
                      placeholder="Key outcomes or agreements..."
                    />
                  </FormField>

                  <FormField label="Follow-up Actions">
                    <Textarea
                      {...register('followUpActions')}
                      className="min-h-[90px]"
                      placeholder="Enter next steps or tasks..."
                    />
                  </FormField>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-medium text-[#1D4ED8]">AI Suggested Follow-ups:</h3>
                  </div>
                  <ul className="list-disc space-y-2 pl-5 text-[14px] text-slate-700">
                    {suggestedFollowUps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                {saveNote ? (
                  <div className="rounded-[10px] border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3 text-[13px] text-[#1D4ED8]">{saveNote}</div>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => dispatch(setSaveNote('Voice note summary will be available once consent is captured.'))}
                  >
                    <Sparkles className="h-4 w-4" />
                    Summarize from Voice Note (Requires Consent)
                  </Button>
                  <Button type="submit" className="min-w-[140px]" disabled={!isValid || isSubmitting || isSaving}>
                    {isSaving ? 'Saving...' : 'Save Interaction'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col bg-white">
            <CardHeader className="border-b border-[#E5E7EB] px-6 py-6">
              <CardTitle className="text-[18px]">AI Assistant</CardTitle>
              <CardDescription className="mt-1">Log interaction via chat</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 px-6 py-6">
              <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] leading-6 text-slate-500">
                Log interaction details here (e.g. &quot;Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure&quot;) or ask for help.
              </div>

              <ScrollArea className="flex min-h-0 flex-1">
                <div className="flex min-h-[320px] flex-col gap-3 pr-1">
                  {messages.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-[10px] bg-white px-6 py-10 text-center text-[13px] text-slate-400">
                      Initially empty. Send a natural language interaction to populate the form.
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={cn(
                          'max-w-[92%] rounded-[10px] border px-4 py-3 text-[13px] leading-6 shadow-sm',
                          message.role === 'user' ? 'ml-auto border-[#DBEAFE] bg-[#EFF6FF] text-slate-800' : 'border-[#E5E7EB] bg-white text-slate-700',
                        )}
                      >
                        {message.content}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="space-y-3">
                <div className="relative">
                  <Input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Describe interaction..."
                    className="pr-12"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void handleAssistantSubmit()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleAssistantSubmit()}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[8px] bg-[#2563EB] text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isAssistantLoading || !chatInput.trim()}
                    aria-label="Send message"
                  >
                    {isAssistantLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    
                  </button>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App