import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import categoryService from "../services/categoryService";

const CategoryDetail = ({ userId }) => {
  const { categoryName } = useParams();
  const [expenses, setExpenses] = useState([]);
  const [imageModal, setImageModal] = useState({ show: false, src: null });

  useEffect(() => {
    fetchExpenses();
  }, [categoryName]);

  const fetchExpenses = async () => {
    try {
      const data = await categoryService.getCategoryExpenses(userId, categoryName);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{categoryName} Expenses</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Date</th>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Amount</th>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Bill Image</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                {new Date(e.dateAdded).toLocaleDateString()}
              </td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                Rs {e.amount}
              </td>
              <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                {e.billImageBase64 ? (
                  <img 
                    src={e.billImageBase64} 
                    alt="Bill" 
                    style={{
                      maxWidth: "80px",
                      maxHeight: "80px",
                      cursor: "pointer",
                      border: "1px solid #ccc",
                      borderRadius: "4px"
                    }}
                    onClick={() => setImageModal({ show: true, src: e.billImageBase64 })}
                    title="Click to view full image"
                  />
                ) : (
                  <span style={{ color: "#999", fontSize: "12px" }}>No image</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: "20px", fontWeight: "bold" }}>
        Total Spent: Rs {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
      </p>

      {/* Image Modal */}
      {imageModal.show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
          onClick={() => setImageModal({ show: false, src: null })}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImageModal({ show: false, src: null })}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "35px",
                height: "35px",
                fontSize: "20px",
                cursor: "pointer"
              }}
              title="Close"
            >
              <FaTimes />
            </button>
            <img
              src={imageModal.src}
              alt="Full Bill"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: "4px"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetail;
