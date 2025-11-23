import React, { useEffect, useState } from "react";
import "./List.css";
import { url, currency } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const List = () => {
  const [list, setList] = useState([]);

  // --- NEW STATE ---
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    surplusPrice: "",
    surplusQuantity: ""
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

  // --- NEW FUNCTIONS ---
  const startEditing = (item) => {
    setEditingId(item._id);
    setEditFormData({
      surplusPrice: item.surplusPrice || "",
      surplusQuantity: item.surplusQuantity || ""
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({ surplusPrice: "", surplusQuantity: "" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveSurplus = async (id) => {
    try {
      const response = await axios.post(`${url}/api/food/surplus`, {
        id: id,
        isSurplus: true,
        surplusPrice: Number(editFormData.surplusPrice),
        surplusQuantity: Number(editFormData.surplusQuantity)
      });
      if (response.data.success) {
        toast.success("Surplus Updated!");
        setEditingId(null);
        await fetchList();
      } else {
        toast.error("Update Failed");
      }
    } catch (error) {
      toast.error("Server Error");
    }
  };

  const disableSurplus = async (id) => {
    try {
      const response = await axios.post(`${url}/api/food/surplus`, {
        id: id,
        isSurplus: false,
        surplusPrice: 0,
        surplusQuantity: 0
      });
      if (response.data.success) {
        toast.success("Removed from Surplus");
        await fetchList();
      }
    } catch (error) {
      toast.error("Error");
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
          <b>Surplus Management</b> {/* <--- INSERT THIS LINE */}
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
                {editingId === item._id ? (
                  <div className="edit-inputs">
                    <input 
                      type="number" name="surplusPrice" placeholder="Price" 
                      value={editFormData.surplusPrice} onChange={handleEditChange}
                      className="surplus-input"
                    />
                    <input 
                      type="number" name="surplusQuantity" placeholder="Qty" 
                      value={editFormData.surplusQuantity} onChange={handleEditChange}
                      className="surplus-input"
                    />
                    <div className="edit-actions">
                      <button onClick={() => saveSurplus(item._id)} className="save-btn">💾</button>
                      <button onClick={cancelEditing} className="cancel-btn">❌</button>
                    </div>
                  </div>
                ) : (
                  <div className="view-mode">
                    {item.isSurplus ? (
                      <span className="surplus-active">
                        🟢 {currency}{item.surplusPrice} ({item.surplusQuantity} left)
                      </span>
                    ) : (
                      <span className="surplus-inactive">⚪ Standard</span>
                    )}
                    <div className="btn-group">
                      <button onClick={() => startEditing(item)} className="edit-btn">
                        {item.isSurplus ? "Edit" : "Add"}
                      </button>
                      {item.isSurplus && (
                        <button onClick={() => disableSurplus(item._id)} className="remove-btn">Stop</button>
                      )}
                    </div>
                  </div>
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
