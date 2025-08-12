// src/pages/NotLoggedIn.jsx
const NotLoggedIn = () => {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">Access Denied</h1>
        <p className="mb-6 text-slate-600">You must be logged in to view this page.</p>
        <a
          href="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Go to Login
        </a>
      </div>
    )
  }
  
  export default NotLoggedIn
  