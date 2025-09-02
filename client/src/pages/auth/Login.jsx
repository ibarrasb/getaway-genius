import { useContext, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "../../context/GlobalState.jsx"
import { Button } from "../../components/ui/button"

const Login = () => {
  const navigate = useNavigate()
  const state = useContext(GlobalState)

  // support both the new key (userAPI) and the old one (UserAPI)
  const api = state?.userAPI ?? state?.UserAPI
  const [isLogged] = api?.isLogged ?? [false]
  const [ , setToken ] = state?.token ?? [null, () => {}]  // ⬅️ grab the token setter

  const [form, setForm] = useState({ email: "", password: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isLogged) navigate("/mytrips", { replace: true })
  }, [isLogged, navigate])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await axios.post("/api/user/login", form) // sets refresh cookie + returns accesstoken
      localStorage.setItem("firstLogin", "true")

      // ✅ Set the token immediately so Header can render right away
      setToken(data?.accesstoken || null)

      // Optional: kick off fetching /infor immediately
      api?.refresh?.()

      // Go to your home page
      navigate("/mytrips", { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.msg || "Login failed. Please try again."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <span className="text-indigo-600">Getaway</span>
          <span>Genius</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to plan your next trip.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login
