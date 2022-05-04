import { useEffect, useState } from 'react'
import { getHeaders } from '../auth/auth-utils'

const useProfile = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    let didCancel = false;
    setError(null);
    (async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile', {
          headers: getHeaders()
        })
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Unable to read profile: ${text}`);
        }
        const body = await response.json()
        if (!didCancel) {
          setData(body);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })()
    return () => {
      didCancel = true;
    }
  }, [])
  return { data, loading, error }
}

export default useProfile
