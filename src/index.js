export const loggedInAction = (infos, accessToken) => ({
  type: '@AUTH/LOGGED_IN',
  ...infos,
  accessToken,
})

export const logOutAction = () => ({
  type: '@AUTH/LOGGED_OUT',
})

// VERY DIRTY HACK so we can use the token without accessing state (ie. in beforeRequest)
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

const beforeRequest = (action, options) => {
  if (!accessToken) return options
  if (action.authenticated === false) return options

  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: rrhAuth.config.jwt.makeAuthHeader(accessToken),
    },
  }
}

const enhanceStartAction = (startAction, params, options) => {
  if (params.isLoginRoute) startAction.isLoginRoute = true

  if (params.ignore401) startAction.ignore401 = true

  if (params.authenticated === false) startAction.authenticated = false

  return startAction
}

const rrhAuth = {
  beforeRequest,
  enhanceStartAction,
  config: {
    jwt: {
      use: true,
      getToken: data => data.access_token,
      makeAuthHeader: accessToken => 'Bearer ' + accessToken,
    },
    shouldLogoutOn401: true,
    redirectToLoginOnLogout: true,
    serversideLogout: true,
  },
}

export default rrhAuth
