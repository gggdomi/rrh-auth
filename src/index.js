export const loggedInAction = (infos, accessToken) => ({
  type: '@AUTH/LOGGED_IN',
  ...infos,
  accessToken,
})

export const logOutAction = () => ({
  type: '@AUTH/LOGGED_OUT',
})

// VERY DIRTY HACK so we can use the token without accessing state
let accessToken = localStorage.getItem('rrh-auth-token', null)

const initialAuthState = {
  ...JSON.parse(localStorage.getItem('rrh-auth-infos', null)),
  accessToken: accessToken,
}

export const authReducer = (state = initialAuthState, action) => {
  if (action.type === loggedInAction().type) {
    accessToken = action.accessToken
    const { type, ...infos } = action
    return {
      ...state,
      ...infos,
    }
  }
  if (action.type === logOutAction().type) return {}
  return state
}

const beforeRequest = options => {
  if (!accessToken) return options
  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: 'Bearer ' + accessToken,
    },
  }
}

export default {
  beforeRequest,
  config: {
    jwt: {
      use: true,
      getToken: data => data.access_token,
      makeAuthHeader: accessToken => 'Bearer ' + accessToken,
    },
  },
}
