import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a unique ID for use in the application
 */
export function generateId(): string {
  return uuidv4()
}

/**
 * Generate a temporary ID for new items before they are saved
 */
export function generateTempId(): string {
  return `temp-${uuidv4()}`
}

/**
 * Check if an ID is a temporary ID
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp-')
}

/**
 * Generate a unique name based on existing names to avoid conflicts
 */
export function generateUniqueName(baseName: string, existingNames: string[]): string {
  let counter = 1
  let name = baseName
  
  while (existingNames.includes(name)) {
    name = `${baseName}_${counter}`
    counter++
  }
  
  return name
}