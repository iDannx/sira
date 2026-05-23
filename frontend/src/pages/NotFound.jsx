import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-blue-600">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-600">
        Sorry, we couldn&apos;t find the page you were looking for.
      </p>
      <Link
        to="/"
        className="inline-block mt-6 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}
