import { put, takeEvery } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import jwtDecode from 'jwt-decode'

import rrhAuth, { loggedInAction, logOutAction } from './'

import rrh, { rrhActions, rrhSuccessRegex, rrhFailRegex } from '@gggdomi/rrh'

// Extract credentials from server response if it is a "login endpoint"
export function* listenToLogin() {
  yield takeEvery(action => action.type.match(rrhSuccessRegex), function*(
    action
  ) {
    const actions = rrhActions[action.groupName]

    if (actions.isLoginEndpoint) {
      let accessToken = null
      let infos = null
      if (rrhAuth.config.jwt) {
        accessToken = rrhAuth.config.jwt.getToken(action.data)
        infos = rrhAuth.config.jwt.getInfos(jwtDecode(accessToken))
      }

      if (infos && accessToken) {
        localStorage.setItem('rrh-auth-infos', JSON.stringify(infos))
        localStorage.setItem('rrh-auth-token', accessToken)
        yield put(loggedInAction(infos, accessToken))
      }
    }
  })
}

export function* dispatchLogoutOn401() {
  yield takeEvery(action => action.type.match(rrhFailRegex), function*(action) {
    const actions = rrhActions[action.groupName]
    if (
      action.response &&
      action.response.status === 401 &&
      rrhAuth.config.shouldLogoutOn401 &&
      !actions.ignore401
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

export default props => [
  listenToLogin,
  makeLogoutSaga(props),
  dispatchLogoutOn401,
]
