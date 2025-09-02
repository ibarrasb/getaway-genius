// src/components/layout/Footer.jsx
import React from "react"

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-10 border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-center text-sm text-slate-600">
          © {year} <span className="font-semibold text-slate-800">Getaway Genius</span>
        </p>
      </div>
    </footer>
  )
}

export default Footer
