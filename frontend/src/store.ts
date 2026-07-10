import { configureStore } from '@reduxjs/toolkit'
import crmReducer from './features/crmSlice'

export const store = configureStore({
  reducer: {
    crm: crmReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch