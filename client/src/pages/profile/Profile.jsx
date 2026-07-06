// src/pages/profile/Profile.jsx
import { useContext, useEffect, useMemo, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Edit3,
  Home,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react"
import { GlobalState } from "@/context/GlobalState.jsx"
import AppSelect from "@/components/ui/AppSelect"
import { ProfileSkeleton } from "@/components/skeletons/AppSkeletons.jsx"

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

const formatDate = (value) => {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const toDateInput = (value) => {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

const userToForm = (user) => ({
  fname: user?.fname || "",
  lname: user?.lname || "",
  birthday: toDateInput(user?.birthday),
  city: user?.city || "",
  state: user?.state || "",
  zip: user?.zip ? String(user.zip) : "",
})

const FieldShell = ({ label, icon, children }) => {
  const ShellIcon = icon

  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <ShellIcon className="h-4 w-4 text-teal-700" />
        {label}
      </span>
      {children}
    </label>
  )
}

const ReadOnlyValue = ({ children }) => (
  <div className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
    {children || "Not set"}
  </div>
)

const Profile = () => {
  const { id } = useParams()

  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [currentUserID] = api?.userID ?? [""]
  const [token] = state?.token ?? [null]
  const [globalLoading] = state?.loading ?? [false]

  const isOwnProfile = currentUserID && currentUserID === id

  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    birthday: new Date().toISOString().slice(0, 10),
    city: "",
    state: "",
    zip: "",
  })

  const initials = useMemo(() => {
    const first = userDetails?.fname?.[0] || "G"
    const last = userDetails?.lname?.[0] || "G"
    return `${first}${last}`.toUpperCase()
  }, [userDetails])

  const joinedLabel = useMemo(() => formatDate(userDetails?.createdAt), [userDetails?.createdAt])

  useEffect(() => {
    let cancel = false
    const controller = new AbortController()

    const run = async () => {
      if (globalLoading) {
        setLoading(true)
        return
      }

      if (!token) {
        setUserDetails(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setSuccess(null)
      try {
        const headers = token ? { Authorization: token } : undefined
        const res = await axios.get(`/api/user/profile/${id}`, {
          signal: controller.signal,
          headers,
        })
        if (cancel) return
        const user = res.data || {}
        setUserDetails(user)
        setFormData(userToForm(user))
      } catch (e) {
        if (!cancel && e.name !== "CanceledError") {
          console.error("Error fetching user details:", e)
          setError("Failed to load profile.")
          setUserDetails(null)
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    }

    run()
    return () => {
      cancel = true
      controller.abort()
    }
  }, [id, token, globalLoading])

  const onChange = (key, val) => {
    setFormData((s) => ({ ...s, [key]: val }))
  }

  const toggleEdit = () => {
    if (!isOwnProfile) return
    setSuccess(null)
    setError(null)
    if (editMode) setFormData(userToForm(userDetails))
    setEditMode((v) => !v)
  }

  const validate = useCallback(() => {
    const { fname, lname, city, state, zip } = formData
    if (!fname || !lname || !city || !state || !zip) return "All fields are required."
    if (!/^[a-zA-Z]+$/.test(fname)) return "First name must contain only letters."
    if (!/^[a-zA-Z]+$/.test(lname)) return "Last name must contain only letters."
    if (!/^\d{5}$/.test(zip)) return "Zip code must be exactly 5 digits."
    return null
  }, [formData])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSubmitting(true)
      const headers = token ? { Authorization: token } : undefined
      await axios.put(`/api/user/profile/${id}`, formData, { headers })
      setUserDetails((u) => ({ ...(u || {}), ...formData }))
      setEditMode(false)
      setSuccess("Profile updated successfully.")
    } catch (e) {
      console.error("Error updating user details:", e)
      setError(e?.response?.data?.msg || "Failed to update profile.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!userDetails) {
    return (
      <div className="gg-page min-h-screen">
        <div className="mx-auto max-w-xl py-16">
          <div className="gg-glass rounded-3xl border border-white/70 p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">User not found</p>
            <Link to="/mission" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-2 font-semibold text-white hover:brightness-105">
              Back to Mission
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gg-page min-h-screen">
      <main className="mx-auto max-w-5xl pb-16">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            to="/mission"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          {isOwnProfile && (
            <button
              type="button"
              onClick={toggleEdit}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                editMode
                  ? "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50"
                  : "bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:brightness-105"
              }`}
            >
              {editMode ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          )}
        </div>

        <section className="gg-glass overflow-hidden rounded-3xl border border-white/70">
          <div className="border-b border-slate-200/70 bg-white/55 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 text-2xl font-extrabold text-white shadow-lg shadow-cyan-900/20">
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                    Traveler Profile
                  </p>
                  <h1 className="mt-1 text-3xl font-bold text-slate-900">
                    {userDetails.fname || "User"} {userDetails.lname || ""}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {userDetails.email}
                    </span>
                    <span className="hidden text-slate-300 sm:inline">|</span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {[userDetails.city, userDetails.state].filter(Boolean).join(", ") || "Location not set"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:w-72">
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Member since</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{joinedLabel}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Access</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-teal-700" />
                    {isOwnProfile ? "Owner" : "View only"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <Check className="h-4 w-4" />
                {success}
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Details</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Keep your account details current for saved plans and ownership.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldShell label="First Name" icon={User}>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.fname}
                      onChange={(e) => onChange("fname", e.target.value)}
                      required
                      pattern="[A-Za-z]*"
                      title="First name must contain only letters."
                      className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-300"
                      placeholder="Jane"
                    />
                  ) : (
                    <ReadOnlyValue>{formData.fname}</ReadOnlyValue>
                  )}
                </FieldShell>

                <FieldShell label="Last Name" icon={User}>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.lname}
                      onChange={(e) => onChange("lname", e.target.value)}
                      required
                      pattern="[A-Za-z]*"
                      title="Last name must contain only letters."
                      className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-300"
                      placeholder="Doe"
                    />
                  ) : (
                    <ReadOnlyValue>{formData.lname}</ReadOnlyValue>
                  )}
                </FieldShell>

                <FieldShell label="Date of Birth" icon={CalendarDays}>
                  {editMode ? (
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => onChange("birthday", e.target.value)}
                      required
                      className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-300"
                    />
                  ) : (
                    <ReadOnlyValue>{formatDate(formData.birthday)}</ReadOnlyValue>
                  )}
                </FieldShell>

                <FieldShell label="Home Base" icon={Home}>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => onChange("city", e.target.value)}
                      required
                      className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-300"
                      placeholder="Austin"
                    />
                  ) : (
                    <ReadOnlyValue>{formData.city}</ReadOnlyValue>
                  )}
                </FieldShell>

	                <FieldShell label="State" icon={MapPin}>
	                  {editMode ? (
	                    <AppSelect
	                      value={formData.state}
	                      onChange={(value) => onChange("state", value)}
	                      options={[
	                        { value: "", label: "Select state" },
	                        ...US_STATES.map((s) => ({ value: s, label: s })),
	                      ]}
	                    />
	                  ) : (
                    <ReadOnlyValue>{formData.state}</ReadOnlyValue>
                  )}
                </FieldShell>

                <FieldShell label="Zip Code" icon={MapPin}>
                  {editMode ? (
                    <>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="\d{5}"
                        value={formData.zip}
                        onChange={(e) => onChange("zip", e.target.value)}
                        required
                        title="Zip code must be exactly 5 digits."
                        className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-300"
                        placeholder="12345"
                      />
                      <p className="mt-1 text-xs text-slate-500">Must be exactly 5 digits.</p>
                    </>
                  ) : (
                    <ReadOnlyValue>{formData.zip}</ReadOnlyValue>
                  )}
                </FieldShell>
              </div>

              {isOwnProfile && editMode && (
                <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(userToForm(userDetails))
                      setEditMode(false)
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </section>

        {!isOwnProfile && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are viewing another user profile. Editing is disabled.
          </div>
        )}
      </main>
    </div>
  )
}

export default Profile
