export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Test Page
        </h1>
        <p className="text-gray-300">
          This is a simple test page without any dependencies.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          If you can see this, the basic routing is working.
        </p>
      </div>
    </div>
  );
}