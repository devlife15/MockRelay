import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { Project } from "../App";
import { AppTopBar } from "../components/AppTopBar";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { DeleteConfirmationDialog } from "../components/DeleteConfirmationDialog";
import { EditProjectDialog } from "../components/EditProjectDialog";
import { Button } from "../components/ui/Button";
import { MoreActionsMenu } from "../components/ui/MoreActionsMenu";

type ProjectsPageProps = {
  onCreateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (project: Project) => void;
  projects: Project[];
};

export function ProjectsPage({ onCreateProject, onDeleteProject, onUpdateProject, projects }: ProjectsPageProps) {
  const navigate = useNavigate();
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  function handleCreate(project: Project) {
    onCreateProject(project);
    setDialogIsOpen(false);
    navigate(`/app/projects/${project.id}`);
  }

  return (
    <div className="flex flex-col bg-[var(--bg-app)] min-h-screen text-[var(--text-primary)]">
      <AppTopBar />
      <main className="flex flex-col flex-1 px-5 sm:px-7 lg:px-10 py-5 min-h-0">
        <div className="flex justify-between items-center gap-4 mx-auto w-full max-w-[1120px]">
          <div>
            <h1 className="font-semibold text-[22px] leading-[30px] tracking-[-0.025em]">
              Projects
            </h1>
            <p className="mt-0.5 text-[var(--text-secondary)] text-xs">
              Organize related mock endpoints under a shared base URL.
            </p>
          </div>
          <Button
            onClick={() => setDialogIsOpen(true)}
            size="small"
            variant="primary"
          >
            <Plus aria-hidden="true" size={12} strokeWidth={2} />
            New project
          </Button>
        </div>

        {projects.length === 0 ? (
          <section className="flex-1 place-items-center grid mx-auto py-12 w-full max-w-[1120px]">
            <div className="max-w-90 text-center">
              <div className="place-items-center grid mx-auto mb-4 rounded-lg size-11 text-[var(--accent)] bg-(--accent-subtle)">
                <FolderPlus aria-hidden="true" size={20} strokeWidth={1.7} />
              </div>
              <h2 className="font-semibold text-base leading-6 tracking-[-0.015em]">
                Create your first mock project
              </h2>
              <p className="mx-auto mt-1.5 max-w-[330px] text-[var(--text-secondary)] text-sm leading-[21px]">
                Group related endpoints together and expose them through one
                callable base URL.
              </p>
              <Button
                className="mt-5"
                onClick={() => setDialogIsOpen(true)}
                size="small"
                variant="primary"
              >
                <Plus aria-hidden="true" size={12} strokeWidth={2} />
                New project
              </Button>
            </div>
          </section>
        ) : (
          <section className="bg-[var(--bg-surface)] mx-auto mt-8 border border-[var(--border-default)] rounded-lg w-full max-w-[1120px] overflow-hidden">
            <div className="items-center gap-4 grid grid-cols-[minmax(220px,1fr)_100px_minmax(190px,0.7fr)_120px_36px] bg-[var(--bg-subtle)] px-4 py-2 border-[var(--border-default)] border-b font-semibold text-[11px] text-[var(--text-muted)]">
              <span>Name</span>
              <span>Endpoints</span>
              <span>Base URL</span>
              <span>Updated</span>
              <span className="sr-only">Actions</span>
            </div>
            {projects.map((project) => (
              <div
                className="items-center gap-4 grid grid-cols-[minmax(220px,1fr)_100px_minmax(190px,0.7fr)_120px_36px] hover:bg-[var(--bg-hover)] px-4 border-[var(--border-default)] border-b last:border-b-0 min-h-16 cursor-pointer"
                key={project.id}
                onClick={() => navigate(`/app/projects/${project.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    navigate(`/app/projects/${project.id}`);
                }}
                role="link"
                tabIndex={0}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] truncate">
                    {project.name}
                  </div>
                  <div className="mt-0.5 text-[var(--text-secondary)] text-xs truncate">
                    {project.description || "No description"}
                  </div>
                </div>
                <span className="text-[var(--text-secondary)] text-xs">
                  {project.endpointCount}
                </span>
                <code className="font-mono text-[var(--text-secondary)] text-xs truncate">
                  /mock/{project.key}
                </code>
                <span className="text-[var(--text-secondary)] text-xs">
                  {project.updatedAt}
                </span>
                <MoreActionsMenu
                  items={[
                    { icon: <Pencil aria-hidden="true" size={13} />, label: "Edit project", onSelect: () => setProjectToEdit(project) },
                    { danger: true, icon: <Trash2 aria-hidden="true" size={13} />, label: "Delete project", onSelect: () => setProjectToDelete(project), separatorBefore: true },
                  ]}
                  label={`More actions for ${project.name}`}
                />
              </div>
            ))}
          </section>
        )}
      </main>

      <CreateProjectDialog
        onCreate={handleCreate}
        onOpenChange={setDialogIsOpen}
        open={dialogIsOpen}
      />
      {projectToEdit ? (
        <EditProjectDialog
          key={projectToEdit.id}
          onOpenChange={(open) => { if (!open) setProjectToEdit(null) }}
          onSave={onUpdateProject}
          open
          project={projectToEdit}
          projects={projects}
        />
      ) : null}
      <DeleteConfirmationDialog
        description="This permanently removes the project and every endpoint inside it. This action cannot be undone."
        itemName={projectToDelete?.name ?? ''}
        onConfirm={() => {
          if (projectToDelete) onDeleteProject(projectToDelete.id)
          setProjectToDelete(null)
        }}
        onOpenChange={(open) => { if (!open) setProjectToDelete(null) }}
        open={Boolean(projectToDelete)}
        title="Delete project?"
      />
    </div>
  );
}
