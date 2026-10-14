import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage'
import { ProjectsPage } from './pages/ProjectsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to="/app" />} />
        <Route
          path="/app"
          element={<ProjectsPage />}
        />
        <Route
          path="/app/projects/:projectId"
          element={<ProjectWorkspacePage />}
        />
        <Route path="*" element={<Navigate replace to="/app" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
