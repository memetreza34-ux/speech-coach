import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Zurück im App-Verlauf. Nach einem Direktlink gibt es keinen — dann zu `fallback`,
// statt mit navigate(-1) die App zu verlassen.
export function useGoBack(fallback) {
  const navigate = useNavigate();
  return useCallback(() => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
