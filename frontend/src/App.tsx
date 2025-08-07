import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import UserManage from "./pages/UserManage";
import UserList from "./pages/UserList";
import ProductManage from "./pages/ProductManage";
import OrderManage from "./pages/OrderManage";
import MessageCenter from "./pages/MessageCenter";
import React from "react";

function RequireAuth({ children }: React.PropsWithChildren<{ children: React.ReactNode }>) {
  const isLogin = localStorage.getItem("isLogin") === "1";
  return isLogin ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManage />} />
          <Route path="users/list" element={<UserList />} />
          <Route path="products" element={<ProductManage />} />
          <Route path="orders" element={<OrderManage />} />
          <Route path="messages" element={<MessageCenter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
