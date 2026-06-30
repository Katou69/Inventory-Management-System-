import { ArrowRight } from "lucide-react"
import { activities } from "@/data/dashboard-data"

export default function ActivityFeed() {
  return (
    <div className="bg-[#e4eeee] rounded-[10px] border border-[#515151] p-5 w-[624px]">
      <div className="flex items-center h-[50px] mb-[10px]">
        <h3 className="font-mono font-bold text-2xl text-black">
          Recent User Activities
        </h3>
      </div>

      <div className="flex flex-col gap-[8px]">
        {activities.map((a) => (
          <div key={a.id} className="bg-white rounded-[10px] border-[0.5px] border-[#727272]">
            <div className="flex items-center p-[10px] gap-[15px]">
              <div className="flex items-center gap-[5px] w-[220px]">
                <img src={a.avatar} alt="" className="size-[25px] rounded-full" />
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-[12px] text-black">
                    {a.name}
                  </span>
                  <span className="font-sans font-light not-italic text-[10px] text-black">
                    {a.role}
                  </span>
                </div>
              </div>
              <p className="font-sans font-light not-italic text-[12px] text-black w-[250px]">
                {a.description}
              </p>
              <div className="flex flex-col items-end w-[65px]">
                <div className="size-[20px]" />
                <span className="font-sans font-light not-italic text-[10px] text-black">
                  {a.date}
                </span>
                <span className="font-mono font-extralight text-[10px] text-black">
                  {a.time}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-end gap-[5px] h-[25px]">
          <span className="font-mono font-normal text-[12px] text-[#0d99ff]">
            View More
          </span>
          <ArrowRight className="size-[15px] text-[#0d99ff]" />
        </div>
      </div>
    </div>
  )
}