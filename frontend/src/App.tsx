import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from "./components/MainLayout";
import { routes } from './routes';
import type { RouteConfig } from './routes';
import { lazyPage } from './lazyPage';

function RequireAuth({ children }: React.PropsWithChildren<{ children: React.ReactNode }>) {
  const isLogin = localStorage.getItem("isLogin") === "1";
  return isLogin ? <>{children}</> : <Navigate to="/login" replace />;
}

// 递归生成 Route
function renderRoutes(routes: RouteConfig[]) {
  return routes.map(route =>
    route.children ? (
      renderRoutes(route.children)
    ) : (
      <Route
        key={route.path}
        path={route.path.startsWith('/') ? route.path.slice(1) : route.path}
        element={
          <Suspense fallback={<div>加载中...</div>}>
            {React.createElement(lazyPage(route.path))}
          </Suspense>
        }
      />
    )
  );
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
          <Route
            index
            element={
              <Suspense fallback={<div>加载中...</div>}>
                {React.createElement(lazyPage('/'))}
              </Suspense>
            }
          />
          {renderRoutes(routes.filter(r => r.path !== '/'))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
