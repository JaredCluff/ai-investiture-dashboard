import { useParams } from 'react-router-dom'
export default function ResearchDetail() {
  const { id } = useParams()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-100">Research Report</h1>
      <p className="text-sm text-gray-500">Report {id} — loading...</p>
    </div>
  )
}
