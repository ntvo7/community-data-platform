// The user roles, from most to least access. Used wherever a role is shown to the user.
export const roles = [
  { value: 'admin', label: 'Main Admin', description: 'everything, including managing users' },
  { value: 'editor', label: 'Authorized User', description: 'creates and edits clients, events and services' },
  { value: 'viewer', label: 'Viewer', description: 'can look at records but not change them' },
]

export const roleLabel = (value) => roles.find((role) => role.value === value)?.label || value
