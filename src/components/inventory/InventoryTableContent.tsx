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
        bg-card
        rounded-xl
        border
        border-border
        shadow-sm
        overflow-visible
      ">


        <table className="min-w-full">


          <thead className="bg-accent border-b border-border">

            <tr className="text-left">


              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                Name
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                SKU
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                Price
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                Category
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                Supplier
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                Supplier ID
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                Stock
              </th>


              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                Status
              </th>


              <th></th>


            </tr>

          </thead>




          <tbody className="divide-y divide-border">


          {filteredInventory.map((item)=>(

            <tr
              key={item.id}
              className="
                hover:bg-accent
              "
            >


              <td className="px-6 py-4 font-medium text-foreground">
                {item.name}
              </td>




              <td className="px-6 py-4 whitespace-nowrap">

                <span
                  className="
                    inline-flex
                    px-2
                    py-0.5
                    rounded-md
                    bg-accent
                    text-muted-foreground
                    text-xs
                    font-mono
                  "
                >
                  {item.sku}
                </span>

              </td>




              <td className="px-6 py-4 whitespace-nowrap text-foreground">
                {item.price.toLocaleString()}
              </td>




              <td className="px-6 py-4 whitespace-nowrap text-foreground">
                {item.category}
              </td>




              <td className="px-6 py-4 text-foreground">
                {item.supplier}
              </td>




              <td className="px-6 py-4 whitespace-nowrap">

                <span
                  className="
                    inline-flex
                    px-2
                    py-0.5
                    rounded-md
                    bg-accent
                    text-muted-foreground
                    text-xs
                    font-mono
                  "
                >
                  {item.supplierId}
                </span>

              </td>




              <td className="px-6 py-4 whitespace-nowrap text-foreground">
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
                  text-muted-foreground
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