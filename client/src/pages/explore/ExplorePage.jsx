// src/pages/favorites/FavoriteTrips.jsx
import ExploreGrid from "@/components/grids/ExploreGrid"
import WishlistGrid from "@/components/grids/WishlistGrid"
import FloatingCreateButton from "@/components/FloatingCreateButton"

const ExplorePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
        <section>
          <header className="mb-4 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Planning</h1>
              <p className="text-sm text-slate-600">Your workbench trips and saved lists.</p>
            </div>
          </header>
          <ExploreGrid />
        </section>

        <section>
          <header className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Wishlists</h2>
          </header>
          <WishlistGrid />
        </section>
      </div>

      <FloatingCreateButton to="/search" label="Create" />
    </div>
  )
}

export default ExplorePage
