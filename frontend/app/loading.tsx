export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        <p className="text-gray-600">Initializing Ingredient Vision Recipe Finder</p>
      </div>
    </div>
  );
}
