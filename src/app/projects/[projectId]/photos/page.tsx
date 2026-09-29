import { redirect } from 'next/navigation'
import { getCachedProject, getCachedUser } from '@/utils/supabase/cached'
import { BYPASS_AUTH } from '@/config/auth'
import PhotosClient from './PhotosClient'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPhotosPage({ params }: PageProps) {
  const { projectId } = await params

  const user = await getCachedUser()
  if (!user && !BYPASS_AUTH) redirect('/login')

  const project = await getCachedProject(projectId)

  return (
    <PhotosClient
      projectId={projectId}
      projectName={project?.name ?? 'this project'}
    />
  )
}
