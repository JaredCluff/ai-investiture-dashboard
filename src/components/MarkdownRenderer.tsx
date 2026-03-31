import ReactMarkdown from 'react-markdown'

interface Props {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <div className={`text-gray-300 leading-relaxed space-y-3 ${className}
      [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-gray-100 [&_h1]:mb-4
      [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-100 [&_h2]:mt-6 [&_h2]:mb-3
      [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-gray-200 [&_h3]:mt-4 [&_h3]:mb-2
      [&_p]:text-gray-300 [&_p]:leading-relaxed
      [&_a]:text-green-400 [&_a]:hover:underline
      [&_strong]:text-gray-100 [&_strong]:font-semibold
      [&_code]:text-green-300 [&_code]:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
      [&_pre]:bg-gray-800 [&_pre]:border [&_pre]:border-gray-700 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto
      [&_pre_code]:bg-transparent [&_pre_code]:p-0
      [&_blockquote]:border-l-2 [&_blockquote]:border-green-500 [&_blockquote]:pl-4 [&_blockquote]:text-gray-400 [&_blockquote]:italic
      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
      [&_li]:text-gray-300
      [&_hr]:border-gray-700 [&_hr]:my-6
      [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse
      [&_th]:text-left [&_th]:text-gray-400 [&_th]:border-b [&_th]:border-gray-700 [&_th]:pb-2
      [&_td]:text-gray-300 [&_td]:border-b [&_td]:border-gray-800 [&_td]:py-2`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
