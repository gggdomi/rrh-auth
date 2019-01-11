export const loggedInAction = username => ({
  type: '@AUTH/LOGGED_IN',
  username,
})

export const logOutAction = () => ({
  type: '@AUTH/LOGGED_OUT',
})

const initialAuthState = {
  username: localStorage.getItem('series-session-username', null),
  accessToken: null,
}

let accessToken = null // VERY DIRTY HACK so we can use the token without accessing state

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
