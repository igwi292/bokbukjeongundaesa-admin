import client from './client'
import type { UserProfile, OwnerProfile } from '../types'

export const fetchProfile = () =>
  client.get<UserProfile>('/v1/owner/accounts/me/')

export const updateProfile = (data: Partial<Pick<UserProfile, 'email' | 'phone'>>) =>
  client.patch<UserProfile>('/v1/owner/accounts/me/', data)

export const updateOwnerProfile = (data: Partial<OwnerProfile>) =>
  client.patch<OwnerProfile>('/v1/owner/accounts/me/profile/', data)
