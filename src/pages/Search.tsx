export default function Search() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-100">Search</h1>
      <p className="text-sm text-gray-500">Search AI-Investiture documents — powered by Knowledge Nexus</p>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <input
          disabled
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
          placeholder="Search coming soon (AII-27)..."
        />
      </div>
    </div>
  )
}
