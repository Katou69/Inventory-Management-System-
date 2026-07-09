"use client"
import { useRef, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { uploadWarehouseImage } from "@/services/dashboard-service"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Real file-format signatures (magic numbers). The browser-reported
// `file.type` is just inferred from the extension and can't be trusted on
// its own — sniffing the actual bytes catches a mislabeled/renamed file
// before it's ever sent to the server.
async function sniffIsValidImage(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47
  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
  return isJpeg || isPng || isWebp
}

export default function WarehouseImagePicker({
  value, onChange,
}: { value: string | null; onChange: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images are allowed.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be 5MB or smaller.")
      return
    }
    if (!(await sniffIsValidImage(file))) {
      setError("That file doesn't look like a valid image.")
      return
    }

    setUploading(true)
    try {
      const url = await uploadWarehouseImage(file)
      onChange(url)
    } catch {
      setError("Couldn't upload that image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative size-20 rounded-full overflow-hidden border border-border bg-accent flex items-center justify-center hover:bg-accent/70 transition-colors disabled:opacity-60"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob:/local preview URLs can't go through next/image's optimizer
          <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
        ) : uploading ? (
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="size-5 text-muted-foreground" />
        )}
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-60"
      >
        {value ? "Change photo" : "Upload photo"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
