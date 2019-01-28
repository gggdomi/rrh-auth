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

function* logoutSaga() {
  const logoutRRH = rrh.new('LOGOUT_RRH_AUTH', '') // url will be overridden

  yield takeEvery(logOutAction().type, function*() {
    // 1. Remove credentials from local storage
    localStorage.removeItem('rrh-auth-infos')
    localStorage.removeItem('rrh-auth-token')

    // 2. Call logout endpoint on server
    if (rrhAuth.config.logoutEndpoint != null) {
      yield put(
        logoutRRH.Start({ overrideRoute: rrhAuth.config.logoutEndpoint })
      )
    }

    // 3. Redirect to /login/
    if (rrhAuth.config.loginRoute != null)
      yield put(push(loginRoute))
  })
}

function* loggedInSaga() {
  yield takeEvery(loggedInAction().type, function*(action) {
    if (rrhAuth.config.redirectToOnLoggedIn != null)
      yield put(push(rrhAuth.config.redirectToOnLoggedIn))
  })
}

export default props => [listenToLogin, logoutSaga, loggedInSaga, dispatchLogoutOn401]
