import React, { useEffect, useState } from "react";
import "./List.css";
import { url, currency } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const List = () => {
  const [list, setList] = useState([]);

  // --- NEW STATE ---
  const [bulkFormId, setBulkFormId] = useState(null);
  const [bulkData, setBulkData] = useState({ 
    packSize: "", 
    price: "", 
    qty: "" 
  });
  // -----------------

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success) {
      setList(response.data.data);
    } else {
      toast.error("Error");
    }
  };

  const removeFood = async (foodId) => {
    const response = await axios.post(`${url}/api/food/remove`, {
      id: foodId,
    });
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message);
    } else {
      toast.error("Error");
    }
  };

// --- 2. NEW BULK FUNCTIONS (Replaces old Surplus functions) ---
  const handleBulkChange = (e) => {
    const { name, value } = e.target;
    setBulkData((prev) => ({ ...prev, [name]: value }));
  };

  const submitBulk = async (originalId) => {
    // Basic validation
    if(!bulkData.packSize || !bulkData.price || !bulkData.qty) {
        toast.error("Please fill all fields");
        return;
    }

    try {
      // Call the new Bulk API endpoint
      const response = await axios.post(`${url}/api/food/create-bulk`, {
        id: originalId,
        packSize: Number(bulkData.packSize),
        bulkPrice: Number(bulkData.price),
        inventoryCount: Number(bulkData.qty)
      });
      
      if (response.data.success) {
        toast.success("Bulk Pack Created!");
        setBulkFormId(null); // Close form
        setBulkData({ packSize: "", price: "", qty: "" }); // Reset data
        await fetchList(); // Refresh list to see the new item
      } else {
        toast.error("Failed to create bulk pack");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server Error");
    }
  };
  // ---------------------

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Bulk Options</b> {/* <--- INSERT THIS LINE */}
          <b>Action</b>
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className="list-table-format">
              
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>
                {currency}
                {item.price}
              </p>

              {/* --- INSERT THIS WHOLE BLOCK --- */}
              <div className="surplus-control">
                
                {/* CASE A: This is already a Bulk Item (show badge) */}
                {item.category === "Bulk Deals" ? (
                     <div style={{display: 'flex', flexDirection: 'column'}}>
                        <span style={{color: '#8e44ad', fontWeight: 'bold', fontSize: '13px'}}>
                            📦 Bulk Pack
                        </span>
                        <span style={{fontSize: '12px', color: '#555', marginTop: '2px'}}>
                            Remaining Stock: <b>{item.surplusQuantity}</b>
                        </span>
                     </div>
                ) : (
                    // CASE B: Standard Item - Check if Form is open
                    bulkFormId === item._id ? (
                        <div className="edit-inputs" style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                            {/* Inputs for creating the pack */}
                            <input 
                              name="packSize" type="number" placeholder="Count (e.g. 5)" 
                              value={bulkData.packSize} onChange={handleBulkChange} 
                              className="surplus-input" style={{width:'120px'}}
                            />
                            <input 
                              name="price" type="number" placeholder="Price ($)" 
                              value={bulkData.price} onChange={handleBulkChange} 
                              className="surplus-input" style={{width:'90px'}}
                            />
                            <input 
                              name="qty" type="number" placeholder="Stock" 
                              value={bulkData.qty} onChange={handleBulkChange} 
                              className="surplus-input" style={{width:'80px'}}
                            />
                            <div className="edit-actions">
                              <button onClick={() => submitBulk(item._id)} className="save-btn" style={{backgroundColor: '#8e44ad'}}>Create</button>
                              <button onClick={() => setBulkFormId(null)} className="cancel-btn">X</button>
                            </div>
                        </div>
                    ) : (
                        // CASE C: Standard Item - Show "Create" Button
                        <button 
                            onClick={() => {
                              setBulkFormId(item._id);
                              setBulkData({ packSize: "", price: "", qty: "" });
                            }} 
                            className="edit-btn" 
                            style={{backgroundColor: '#8e44ad', width: '100%'}}
                        >
                            📦 Create Bundle
                        </button>
                    )
                )}
              </div>
              {/* ------------------------------- */}
              
              <p className="cursor" onClick={() => removeFood(item._id)}>
                ❌
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default List;
