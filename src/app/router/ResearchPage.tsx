import { ProjectsPage } from '@/features/projects/components/ProjectsPage'

/** Research (thesis) work reuses the generic project model filtered by kind. */
export function ResearchPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Ilmiy ish loyihalari: bosqichlar, vazifalar va sarflangan vaqt loyiha sahifasida.</p>
      <ProjectsPage kind="research" />
    </div>
  )
}
