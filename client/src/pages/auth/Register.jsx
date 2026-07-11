import { useContext, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "../../context/GlobalState.jsx"
import AppSelect from "@/components/ui/AppSelect"
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
    if (isLogged) navigate("/mission", { replace: true })
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
    if (!form.state) {
      setError("Select a state.")
      return
    }
  
    try {
      setSubmitting(true)
      await axios.post("/api/user/register", form)
  
      // optional: let login page know they just created an account
      navigate("/login?created=1", { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.msg || "Registration failed. Please try again."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }
  

  return (
    <div className="min-h-screen px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5">
      <header className="mx-auto flex max-w-6xl justify-center py-6 sm:justify-start sm:py-4">
        <Link to="/" className="inline-flex rounded-2xl">
          <img
            src="/getaway-genius-logo.png"
            alt="Getaway Genius"
            className="h-24 w-auto max-w-[82vw] object-contain sm:h-20 md:h-24"
          />
        </Link>
      </header>

      <main className="mx-auto flex max-w-6xl items-center justify-center pb-8 pt-2 sm:py-8">
        <div className="gg-glass w-full max-w-xl rounded-3xl border border-white/70 p-6 sm:p-8">
          <h1 className="text-center text-2xl font-bold text-slate-900 sm:text-left">Create your account</h1>
          <p className="mt-1 text-center text-sm text-slate-600 sm:text-left">Create a workspace for comparing options and planning what counts.</p>

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
  <label className="mb-1 block text-sm font-medium text-slate-700">
    Date of birth
  </label>

  <div className="relative">
    <input
      type="date"
      name="birthday"
      required
      value={form.birthday}
      onChange={onChange}
      className="
        block w-full rounded-xl border border-slate-300 bg-white
        px-4 pr-10 py-2.5 h-12
        text-slate-900 shadow-sm outline-none transition
        focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300
        appearance-none [-webkit-appearance:none]
      "
    />
    {/* optional calendar icon so the padding-right makes visual sense */}

  </div>
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
              <AppSelect
                value={form.state}
                onChange={(value) => setForm((s) => ({ ...s, state: value }))}
                options={[
                  { value: "", label: "Select state" },
                  ...US_STATES.map((s) => ({ value: s, label: s })),
                ]}
              />
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
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-2.5 text-white shadow-md transition hover:brightness-105 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create Account"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Register
