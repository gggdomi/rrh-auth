export const loggedInAction = username => ({
  type: '@AUTH/LOGGED_IN',
  username,
})

export const logOutAction = () => ({
  type: '@AUTH/LOGGED_OUT',
})

const initialAuthState = {
  username: localStorage.getItem('series-session-username', null),
}

export const authReducer = (state = initialAuthState, action) => {
  if (action.type === loggedInAction().type)
    return { ...state, username: action.username }
  if (action.type === logOutAction().type) return { ...state, username: null }
  return state
}
