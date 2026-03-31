import { useParams } from 'react-router-dom'
export default function TicketDetail() {
  const { identifier } = useParams()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-100">Ticket {identifier}</h1>
      <p className="text-sm text-gray-500">Loading from /api/tickets/{identifier}...</p>
    </div>
  )
}
