import { Eye } from "lucide-react"
import { products } from "@/data/dashboard-data"

export default function ProductTable() {
  return (
    <div className="bg-[#e4eeee] rounded-[10px] border border-[#515151] p-5 w-[520px]">
      <div className="flex items-center justify-between h-[50px] mb-[8px]">
        <h3 className="font-sans font-bold text-2xl text-black">
          Top Ordered Products here
        </h3>
        <div className="relative">
          <div className="border border-black rounded-[5px] px-[16px] py-[7px] text-[12px] font-mono font-extralight">
            This month
          </div>
        </div>
      </div>

      <div className="bg-[#2563eb] rounded-[5px] border border-black w-full">
        <div className="flex items-center px-[15px] py-[10px] text-[12px] text-white font-bold">
          <span className="w-[25px] text-center font-mono">No</span>
          <span className="w-[110px] font-sans not-italic">Product Name</span>
          <span className="w-[110px] font-sans not-italic">Category</span>
          <span className="w-[90px] font-sans not-italic">Quantity</span>
          <span className="w-[70px] font-sans not-italic">Revenue</span>
          <span className="w-[25px]" />
        </div>
      </div>

      <div className="flex flex-col gap-[5px] mt-[5px]">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-[5px] border-[0.5px] border-[#727272] w-full">
            <div className="flex items-center px-[15px] py-[10px] text-[12px] text-black">
              <span className="w-[25px] text-center font-mono font-light">{p.id}</span>
              <div className="w-[110px] flex items-center gap-[5px]">
                <img src={p.image} alt="" className="size-[20px] rounded-full" />
                <span className="font-sans font-bold not-italic">{p.name}</span>
              </div>
              <span className="w-[110px] font-sans font-light not-italic">{p.category}</span>
              <span className="w-[90px] font-sans font-bold not-italic">{p.quantity}</span>
              <span className="w-[70px] font-sans font-light not-italic">{p.revenue}</span>
              <div className="w-[25px] flex items-center justify-center">
                <Eye className="size-[15px] text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}