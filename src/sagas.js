import { put, takeEvery } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import jwtDecode from 'jwt-decode'

import rrhAuth, { loggedInAction, logOutAction } from './'

import { rrhActions, rrhSuccessRegex, rrhFailRegex } from '@gggdomi/rrh'

// Extract credentials from server response if it is a "login endpoint"
export function* listenToLogin() {
  yield takeEvery(action => action.type.match(rrhSuccessRegex), function*(
    action
  ) {
    const groupName = action.type.match(rrhSuccessRegex)[1]
    const actions = rrhActions[groupName]

    if (actions.isLoginEndpoint) {
      if (rrhAuth.config.jwt) {
        const accessToken = rrhAuth.config.jwt.getToken(action.data)
        const infos = jwtDecode(accessToken)
      }
      localStorage.setItem('rrh-auth-infos', JSON.stringify(infos))
      localStorage.setItem('rrh-auth-token', accessToken)
      yield put(loggedInAction(infos, accessToken))
    }
  })
}

export function* dispatchLogoutOn401() {
  yield takeEvery(action => action.type.match(rrhFailRegex), function*(action) {
    if (
      action.error.response &&
      action.error.response.status === 401 &&
      rrhAuth.config.shouldLogoutOn401 &&
      !action.startAction.ignore401
    ) {
      yield put(logOutAction())
    }
  })
}

export const makeLogoutSaga = ({
  loginRoute = '/login/', // in react router
  logoutEndpoint = '/logout/', // on the server
}) =>
  function* logoutSaga() {
    const logoutRRH = logoutEndpoint
      ? rrh.new('LOGOUT_RRH_AUTH', logoutEndpoint)
      : null

    yield takeEvery(logOutAction().type, function*() {
      // 1. Remove credentials from local storage
      localStorage.removeItem('rrh-auth-infos')
      localStorage.removeItem('rrh-auth-token')

      // 2. Call logout endpoint on server
      if (rrhAuth.config.serversideLogout && logoutRRH) {
        yield put(logoutRRH.Start())
      }

      // 3. Redirect to /login/
      if (rrhAuth.config.redirectToLoginOnLogout && loginRoute)
        yield put(push(loginRoute))
    })
  }

export default loginRoute => [
  listenToLogin,
  makeLogoutSaga(loginRoute),
  dispatchLogoutOn401,
]
