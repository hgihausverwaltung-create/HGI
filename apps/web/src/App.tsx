import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { TemplatesHomePage } from "./pages/TemplatesHomePage";
import { TemplateEditorPage } from "./pages/TemplateEditorPage";
import { TemplateDetailPage } from "./pages/TemplateDetailPage";
import { DraftEditorPage } from "./pages/DraftEditorPage";
import { PropertiesPage } from "./pages/PropertiesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<TemplatesHomePage />} />
        <Route path="/templates/new" element={<TemplateEditorPage mode="create" />} />
        <Route path="/templates/:id" element={<TemplateDetailPage />} />
        <Route path="/templates/:id/edit" element={<TemplateEditorPage mode="edit" />} />
        <Route path="/drafts/:id" element={<DraftEditorPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
      </Route>
    </Routes>
  );
}
