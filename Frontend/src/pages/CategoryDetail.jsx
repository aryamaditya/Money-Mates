import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import categoryService from "../services/categoryService";

const CategoryDetail = ({ userId }) => {
  const { categoryName } = useParams();
  const [expenses, setExpenses] = useState([]);

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
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.dateAdded).toLocaleDateString()}</td>
              <td>{e.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Total Spent: {expenses.reduce((sum, e) => sum + e.amount, 0)}</p>
    </div>
  );
};

export default CategoryDetail;
