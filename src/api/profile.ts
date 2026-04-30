import client from './client'
import type { UserProfile } from '../types'

let MOCK_PROFILE: UserProfile = {
  id: 1,
  username: 'taehee',
  email: 'kimtaehee1030@gmail.com',
  phone: '010-1234-5678',
}

export const fetchProfile = () =>
  Promise.resolve({ data: MOCK_PROFILE }) as ReturnType<typeof client.get<UserProfile>>

export const updateProfile = (data: Partial<Pick<UserProfile, 'email' | 'phone'>>) => {
  MOCK_PROFILE = { ...MOCK_PROFILE, ...data }
  return Promise.resolve({ data: MOCK_PROFILE }) as ReturnType<typeof client.patch<UserProfile>>
}
