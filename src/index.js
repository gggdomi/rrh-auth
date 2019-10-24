import { makeSagas } from './sagas'
import { loggedInAction, logOutAction } from './actions'

const defaultOptions = {
  jwt: {
    use: true,
    getToken: data => data.access_token,
    makeAuthHeader: accessToken => 'Bearer ' + accessToken,
    getInfos: data => data.identity,
  },
  shouldLogoutOn401: true,
  redirectToOnLoggedIn: '/',
  loginRoute: '/login/', // in react router
  logoutEndpoint: '/logout/', // on the server
  storageGet: key => localStorage.getItem(key),
  storageSet: (key, item) => localStorage.setItem(key, item),
  storageRemove: key => localStorage.removeItem(key),
  storageKey: 'rrh-auth-token',
  statePath: 'auth',
}

export const createRRHAuth = ({ options = { jwt: {} } }) => rrh => {
  const finalOptions = {
    ...defaultOptions,
    ...options,
    jwt: { ...defaultOptions.jwt, ...options.jwt },
  }

  const rrhAuth = {
    options: finalOptions,
  }

  const initialAuthState = {
    ...JSON.parse(rrhAuth.options.storageGet(rrhAuth.options.storageKey)),
  }

  rrh.authReducer = (state = initialAuthState, action) => {
    if (action.type === loggedInAction().type) {
      const { type, ...infos } = action
      return {
        ...state,
        ...infos,
      }
    }
    if (action.type === logOutAction().type) return {}
    return state
  }

  rrhAuth.beforeRequest = (action, options) => {
    const accessToken = rrh.store.getState()[rrhAuth.options.statePath]
      .accessToken
    if (!accessToken) return options
    if (action.authenticated === false) return options

    return {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: rrhAuth.options.jwt.makeAuthHeader(accessToken),
      },
    }
  }

  rrhAuth.enhanceStartAction = (startAction, params, options) => {
    if (options.authenticated === false) startAction.authenticated = false

    return startAction
  }

  rrhAuth.sagas = makeSagas(rrhAuth, rrh)

  return rrhAuth
}

export { loggedInAction, logOutAction }
