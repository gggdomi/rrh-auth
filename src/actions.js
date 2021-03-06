export const loggedInAction = (infos, accessToken) => ({
  type: '@RRH-AUTH/LOGGED_IN',
  ...infos,
  accessToken,
})

export const logOutAction = () => ({
  type: '@RRH-AUTH/LOGGED_OUT',
})

export const initialStateLoadedAction = authData => ({
  type: '@RRH-AUTH/CREDENTIALS_LOADED',
  authData,
})
