import client from './client'

export const changePassword = (current_password: string, new_password: string) =>
  client.post('/v1/owner/auth/password/change/', { current_password, new_password })

export const deleteAccount = () =>
  client.delete('/v1/owner/account/')
