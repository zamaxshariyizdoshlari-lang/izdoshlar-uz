import { Navigate } from 'react-router-dom'

// Demolar endi "Bizning loyihalar" sahifasida
export function Component() {
  return <Navigate to="/loyihalar" replace />
}
