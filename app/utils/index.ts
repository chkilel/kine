export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

// Generate avatar background color based on patient name
export const getAvatarBgColor = (firstName: string, lastName: string) => {
  const colors = ['bg-blue-100', 'bg-green-100', 'bg-amber-100', 'bg-red-100', 'bg-purple-100', 'bg-pink-100']
  const index = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length
  return colors[index]
}

// Generate avatar text color
export const getAvatarTextColor = (firstName: string, lastName: string) => {
  const colors = [
    'text-blue-600',
    'text-green-600',
    'text-amber-600',
    'text-red-600',
    'text-purple-600',
    'text-pink-600'
  ]
  const index = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length
  return colors[index]
}
