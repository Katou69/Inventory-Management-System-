import { Plus, ArrowRight } from "lucide-react"
import { warehouses } from "@/data/dashboard-data"

export default function WarehouseTable() {
  return (
    <div className="bg-[#e4eeee] rounded-[10px] border border-[#fbffff] p-5 w-full">
      <div className="flex items-center justify-between mb-[9px]">
        <h3 className="font-sans font-bold text-2xl text-black">
          Warehouse Overview
        </h3>
        <Plus className="size-[41px] text-[#1E1E1E]" />
      </div>

      <div className="bg-[#2563eb] rounded-[5px] w-full">
        <div className="flex items-center px-[15px] py-[10px] text-[14px] text-white font-bold">
          <span className="w-[30px] text-center font-mono">No</span>
          <span className="flex-1 font-sans not-italic">Warehouse Name</span>
          <span className="w-[140px] font-sans not-italic">Last Inspection Date</span>
          <span className="w-[100px] font-sans not-italic">Warehouse ID</span>
          <span className="w-[120px] font-sans not-italic">Location</span>
          <span className="w-[160px] font-sans not-italic">Assigned Manager</span>
          <span className="w-[140px] font-sans not-italic">Capacity</span>
          <span className="w-[110px] font-mono">Action</span>
        </div>
      </div>

      <div className="flex flex-col gap-[5px] mt-[9px]">
        {warehouses.map((wh) => (
          <div key={wh.id} className="bg-white rounded-[5px] w-full">
            <div className="flex items-center px-[15px] py-[10px] text-[12px] text-black">
              <span className="w-[30px] text-center font-mono font-light">{wh.id}</span>
              <div className="flex-1 flex items-center gap-[10px]">
                <img src={wh.image} alt="" className="size-[25px] rounded-full" />
                <span className="font-sans font-bold not-italic">{wh.name}</span>
              </div>
              <span className="w-[140px] font-sans font-light not-italic">{wh.lastInspection}</span>
              <span className="w-[100px] font-sans font-light not-italic">{wh.warehouseId}</span>
              <span className="w-[120px] font-sans font-light not-italic">{wh.location}</span>
              <span className="w-[160px] font-sans font-light not-italic">{wh.manager}</span>
              <span className="w-[140px] font-sans font-light not-italic">{wh.capacityUsed.toLocaleString()} / {wh.capacityTotal.toLocaleString()}</span>
              <span className="w-[110px] flex items-center gap-1 text-[#5da3ff] font-mono font-normal">
                View Details <ArrowRight className="size-4" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}