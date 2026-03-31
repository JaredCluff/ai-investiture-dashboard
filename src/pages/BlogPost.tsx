import { useParams } from 'react-router-dom'
export default function BlogPost() {
  const { slug } = useParams()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-100">Blog Post</h1>
      <p className="text-sm text-gray-500">Post {slug} — loading...</p>
    </div>
  )
}
