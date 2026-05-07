import client from './client'
import type { UserProfile, OwnerProfile } from '../types'

export const fetchProfile = () =>
  client.get<UserProfile>('/accounts/me/')

export const updateProfile = (data: Partial<Pick<UserProfile, 'email' | 'phone'>>) =>
  client.patch<UserProfile>('/accounts/me/', data)

export const updateOwnerProfile = (data: Partial<OwnerProfile>) =>
  client.patch<OwnerProfile>('/accounts/me/profile/', data)
