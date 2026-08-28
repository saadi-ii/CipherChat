export interface User {
  _id: string
  username: string
  email: string
  avatar?: string | null
  lastSeen?: string
}

export interface Message {
  _id: string
  sender: string
  receiver: string
  text: string
  read: boolean
  createdAt: string
}
