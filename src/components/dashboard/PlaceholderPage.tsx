import { Construction } from "lucide-react"

export default function PlaceholderPage({
  title, description,
}: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="size-16 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center mb-5">
        <Construction className="size-8 text-indigo-500" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">{description}</p>
    </div>
  )
}
