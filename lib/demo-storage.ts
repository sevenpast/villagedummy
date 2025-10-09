// Simple in-memory storage for demo purposes
// This simulates a database for demo mode

export interface DemoUser {
  username: string
  password: string
  userData: any
}

export const demoUsers = new Map<string, DemoUser>()

export function addDemoUser(username: string, password: string, userData: any) {
  demoUsers.set(username, { username, password, userData })
  console.log('DEMO: User added to storage:', username)
  console.log('DEMO: Total users in storage:', demoUsers.size)
}

export function getDemoUser(username: string): DemoUser | undefined {
  return demoUsers.get(username)
}

export function validateDemoCredentials(username: string, password: string): boolean {
  const user = demoUsers.get(username)
  return user ? user.password === password : false
}
