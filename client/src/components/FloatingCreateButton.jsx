import { Link } from "react-router-dom"

const FloatingCreateButton = ({ to = "/search", label = "Create" }) => {
  return (
    <Link
      to={to}
      className="group fixed bottom-6 right-6 flex items-center gap-2 rounded-full 
                 bg-indigo-600/90 backdrop-blur-lg px-6 py-3 font-semibold text-white 
                 shadow-lg shadow-indigo-500/30 transition-all duration-300 ease-out
                 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 hover:rotate-1 
                 active:scale-95"
      aria-label={label}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 
                   text-white group-hover:bg-white/30 transition"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label}
    </Link>
  )
}

export default FloatingCreateButton
