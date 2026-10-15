import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import AppRouter from './appRouter.tsx'
import { Provider } from 'react-redux'
import { store } from './slices/store.ts'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <AppRouter />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
