import React from 'react'

function ProjectError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to load project</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export default ProjectError


