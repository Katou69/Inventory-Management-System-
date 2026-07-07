"use client";

import { useState } from "react";

import { Badge } from "@/components/ui";
import { InventoryItem } from "@/types/inventory";

import ProductMenu from "./ProductMenu";
import EditProductModal from "./EditProductModal";
import ViewHistoryModal from "./ViewHistoryModal";
import Filters from "./Filters";


interface Props {
  inventory: InventoryItem[];
}


export default function InventoryTableContent({
  inventory,
}: Props) {


  const [search, setSearch] = useState("");


  const [selectedProduct, setSelectedProduct] =
    useState<InventoryItem | null>(null);


  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);



  const filteredInventory = inventory.filter((item)=>{

    const keyword = search.toLowerCase();


    return (

      item.name.toLowerCase().includes(keyword) ||

      item.sku.toLowerCase().includes(keyword) ||

      item.category.toLowerCase().includes(keyword) ||

      item.supplier.toLowerCase().includes(keyword) ||

      item.supplierId.toLowerCase().includes(keyword)

    );

  });



  return (
    <>

      <Filters
        search={search}
        setSearch={setSearch}
      />



      <div className="
        bg-white
        rounded-xl
        border
        border-slate-200
        shadow-sm
        overflow-visible
      ">


        <table className="min-w-full">


          <thead className="bg-slate-50 border-b border-slate-200">

            <tr className="text-left">


              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Name
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                SKU
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Price
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Category
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Supplier
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Supplier ID
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Stock
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Status
              </th>


              <th></th>


            </tr>

          </thead>



          <tbody>


          {filteredInventory.map((item)=>(

            <tr
              key={item.id}
              className="
                border-b
                border-slate-100
                hover:bg-slate-50
              "
            >


              <td className="px-6 py-4 font-medium ">
                {item.name}
              </td>



              <td className="px-6 py-4 whitespace-nowrap">

                <span
                  className="
                    inline-flex
                    px-2
                    py-0.5
                    rounded-md
                    bg-slate-100
                    text-slate-600
                    text-xs
                    font-mono
                  "
                >
                  {item.sku}
                </span>

              </td>



              <td className="px-6 py-4 whitespace-nowrap">
                {item.price.toLocaleString()}
              </td>



              <td className="px-6 py-4 whitespace-nowrap">
                {item.category}
              </td>



              <td className="px-6 py-4 ">
                {item.supplier}
              </td>



              <td className="px-6 py-4 whitespace-nowrap">

                <span
                  className="
                    inline-flex
                    px-2
                    py-0.5
                    rounded-md
                    bg-slate-100
                    text-slate-600
                    text-xs
                    font-mono
                  "
                >
                  {item.supplierId}
                </span>

              </td>



              <td className="px-6 py-4 whitespace-nowrap">
                {item.stock}
              </td>



              <td className="px-6 py-4 whitespace-nowrap">
                <Badge status={item.status}/>
              </td>



              <td className="px-6 py-4">

                <ProductMenu

                  onEdit={()=>{
                    setSelectedProduct(item);
                    setEditOpen(true);
                  }}


                  onHistory={()=>{
                    setSelectedProduct(item);
                    setHistoryOpen(true);
                  }}

                />

              </td>


            </tr>

          ))}



          {filteredInventory.length === 0 && (

            <tr>

              <td
                colSpan={9}
                className="
                  text-center
                  py-8
                  text-slate-500
                "
              >
                No products found
              </td>

            </tr>

          )}



          </tbody>


        </table>


      </div>



      <EditProductModal
        open={editOpen}
        product={selectedProduct}
        onClose={()=>{
          setEditOpen(false);
          setSelectedProduct(null);
        }}
      />



      <ViewHistoryModal
        open={historyOpen}
        product={selectedProduct}
        onClose={()=>{
          setHistoryOpen(false);
          setSelectedProduct(null);
        }}
      />


    </>
  );
}