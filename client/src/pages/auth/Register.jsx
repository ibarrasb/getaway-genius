import { useContext, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "../../context/GlobalState.jsx"
// If you have a Button component, use it. Otherwise the <button> below is styled already.

const Register = () => {
  const navigate = useNavigate()
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [isLogged] = api?.isLogged ?? [false]

  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    birthday: "",
    city: "",
    state: "",
    zip: "",
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isLogged) navigate("/home", { replace: true })
  }, [isLogged, navigate])

  const US_STATES = useMemo(
    () => [
      "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
    ],
    []
  )

  const onChange = (e) => {
    const { name, value } = e.target
    if (name === "zip") {
      if (/^\d{0,5}$/.test(value)) setForm((s) => ({ ...s, zip: value }))
      return
    }
    setForm((s) => ({ ...s, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.zip.length !== 5) {
      setError("Zip code must be exactly 5 digits.")
      return
    }

    try {
      setSubmitting(true)
      await axios.post("/api/user/register", form)
      localStorage.setItem("firstLogin", "true")
      navigate("/home", { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.msg || "Registration failed. Please try again."
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
        <div className="w-full max-w-xl rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-600">It only takes a minute.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
              <input
                name="fname"
                required
                value={form.fname}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                placeholder="Jane"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
              <input
                name="lname"
                required
                value={form.lname}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                placeholder="Doe"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                placeholder="you@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                placeholder="••••••••"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Date of birth</label>
              <input
                type="date"
                name="birthday"
                required
                value={form.birthday}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
              <input
                name="city"
                required
                value={form.city}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                placeholder="Austin"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">State</label>
              <select
                name="state"
                required
                value={form.state}
                onChange={onChange}
                className="block w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Zip code</label>
              <input
                name="zip"
                inputMode="numeric"
                pattern="\d{5}"
                required
                value={form.zip}
                onChange={onChange}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                placeholder="12345"
              />
              <p className="mt-1 text-xs text-slate-500">Must be exactly 5 digits.</p>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Register"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Register
