// src/pages/profile/Profile.jsx
import { useContext, useEffect, useMemo, useState, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "@/context/GlobalState.jsx"

const Profile = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [currentUserID] = api?.userID ?? [""]
  const [token] = state?.token ?? [null]

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

  const US_STATES = useMemo(
    () => [
      "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
    ],
    []
  )

  // Fetch user details
  useEffect(() => {
    let cancel = false
    const controller = new AbortController()

    const run = async () => {
      setLoading(true)
      setError(null)
      setSuccess(null)
      try {
        const headers = token ? { Authorization: token } : undefined // raw token per your middleware
        const res = await axios.get(`/api/user/profile/${id}`, {
          signal: controller.signal,
          headers,
        })
        if (cancel) return
        const u = res.data || {}
        setUserDetails(u)
        setFormData({
          fname: u.fname || "",
          lname: u.lname || "",
          birthday: (u.birthday ? new Date(u.birthday) : new Date()).toISOString().slice(0,10),
          city: u.city || "",
          state: u.state || "",
          zip: u.zip || "",
        })
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
  }, [id, token])

  const onChange = (key, val) => {
    setFormData((s) => ({ ...s, [key]: val }))
  }

  const toggleEdit = () => {
    if (!isOwnProfile) return
    setSuccess(null)
    setError(null)
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

    const v = validate()
    if (v) {
      setError(v)
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl ring-1 ring-slate-200">
            <div className="mb-4 h-6 w-40 rounded bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-12 rounded bg-slate-200" />
              <div className="h-12 rounded bg-slate-200" />
              <div className="h-12 rounded bg-slate-200 md:col-span-2" />
              <div className="h-12 rounded bg-slate-200 md:col-span-2" />
              <div className="h-12 rounded bg-slate-200 md:col-span-2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
        <div className="mx-auto max-w-xl px-4 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-slate-900">User not found</p>
            <Link to="/mytrips" className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">
              Back to My Trips
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      <header className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link
            to="/mytrips"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
            </svg>
            Back
          </Link>

          {isOwnProfile && (
            <button
              type="button"
              onClick={toggleEdit}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                editMode
                  ? "bg-slate-100 text-slate-800 ring-1 ring-slate-300 hover:bg-slate-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <h1 className="text-2xl font-bold text-slate-900">
            {userDetails.fname || "User"} {userDetails.lname || ""}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Manage your profile details.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
              <input
                type="text"
                value={formData.fname}
                onChange={(e) => onChange("fname", e.target.value)}
                disabled={!editMode || !isOwnProfile}
                required
                pattern="[A-Za-z]*"
                title="First name must contain only letters."
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="Jane"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
              <input
                type="text"
                value={formData.lname}
                onChange={(e) => onChange("lname", e.target.value)}
                disabled={!editMode || !isOwnProfile}
                required
                pattern="[A-Za-z]*"
                title="Last name must contain only letters."
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="Doe"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Date of Birth</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => onChange("birthday", e.target.value)}
                disabled={!editMode || !isOwnProfile}
                required
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => onChange("city", e.target.value)}
                disabled={!editMode || !isOwnProfile}
                required
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="Austin"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">State</label>
              <select
                value={formData.state}
                onChange={(e) => onChange("state", e.target.value)}
                disabled={!editMode || !isOwnProfile}
                required
                className="block w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">Select State</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Zip Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{5}"
                value={formData.zip}
                onChange={(e) => onChange("zip", e.target.value)}
                disabled={!editMode || !isOwnProfile}
                required
                title="Zip code must be exactly 5 digits."
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="12345"
              />
              <p className="mt-1 text-xs text-slate-500">Must be exactly 5 digits.</p>
            </div>

            {isOwnProfile && editMode && (
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // reset form to current userDetails
                    setFormData({
                      fname: userDetails.fname || "",
                      lname: userDetails.lname || "",
                      birthday: (userDetails.birthday ? new Date(userDetails.birthday) : new Date()).toISOString().slice(0,10),
                      city: userDetails.city || "",
                      state: userDetails.state || "",
                      zip: userDetails.zip || "",
                    })
                    setEditMode(false)
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </form>
        </div>

        {!isOwnProfile && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You’re viewing another user’s profile. Editing is disabled.
          </div>
        )}
      </main>
    </div>
  )
}

export default Profile
