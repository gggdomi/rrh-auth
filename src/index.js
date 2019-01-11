export const loggedInAction = (username, accessToken) => ({
  type: '@AUTH/LOGGED_IN',
  username,
  accessToken,
})

export const logOutAction = () => ({
  type: '@AUTH/LOGGED_OUT',
})

// VERY DIRTY HACK so we can use the token without accessing state
let accessToken = localStorage.getItem('rrh-auth-token', null)

const initialAuthState = {
  username: localStorage.getItem('rrh-auth-username', null),
  accessToken: accessToken,
}

export const authReducer = (state = initialAuthState, action) => {
  if (action.type === loggedInAction().type) {
    accessToken = action.accessToken
    return {
      ...state,
      username: action.username,
      accessToken: action.accessToken,
    }
  }
  if (action.type === logOutAction().type) return { ...state, username: null }
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
}
