import { Bell } from "lucide-react"

export default function Header() {
  return (
    <header className="bg-white border-b border-[#307cd3] h-20 flex items-center justify-between px-8 w-full">
      <div className="flex items-center gap-4">
        <div className="bg-black border border-[#1d1d1d] rounded-xl h-[50px] w-[49px] flex items-center justify-center">
          <span className="text-white text-[32px] font-sans font-bold">C</span>
        </div>
        <span className="font-sans font-bold text-2xl text-black">GRGI</span>
      </div>
      <div className="flex items-center gap-4">
        <Bell className="size-6 text-[#1D1B20]" />
        <div className="size-15 bg-[#eaddff] rounded-full flex items-center justify-center">
          <span className="bg-[#eaddff] text-[#4F378A] text-lg font-medium">U</span>
        </div>
      </div>
    </header>
  )
}