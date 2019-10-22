import { put, takeEvery } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import jwtDecode from 'jwt-decode'

import { loggedInAction, logOutAction } from './actions'

import { rrhSuccessRegex, rrhFailRegex } from '@gggdomi/rrh'

// Extract credentials from server response if it is a "login endpoint"

export const makeSagas = (rrhAuth, rrh) => {
  function* listenToLogin() {
    yield takeEvery(action => action.type.match(rrhSuccessRegex), function*(
      action
    ) {
      const actions = rrh.actions[action.groupName]

      if (actions.isLoginEndpoint) {
        let accessToken = null
        let infos = null
        if (rrhAuth.options.jwt) {
          accessToken = rrhAuth.options.jwt.getToken(action.data)
          infos = rrhAuth.options.jwt.getInfos(jwtDecode(accessToken))
        }

        if (infos && accessToken) {
          rrhAuth.options.storageSet(rrhAuth.options.storageInfosKey, JSON.stringify(infos))
          rrhAuth.options.storageSet(rrhAuth.options.storageTokenKey, accessToken)
          yield put(loggedInAction(infos, accessToken))
        }
      }
    })
  }

  function* dispatchLogoutOn401() {
    yield takeEvery(action => action.type.match(rrhFailRegex), function*(action) {
      const actions = rrh.actions[action.groupName]
      if (
        action.response &&
        action.response.status === 401 &&
        rrhAuth.options.shouldLogoutOn401 &&
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
      rrhAuth.options.storageRemove(rrhAuth.options.storageInfosKey)
      rrhAuth.options.storageRemove(rrhAuth.options.storageTokenKey)

      // 2. Call logout endpoint on server
      if (rrhAuth.options.logoutEndpoint != null) {
        yield put(
          logoutRRH.Start({ overrideRoute: rrhAuth.options.logoutEndpoint })
        )
      }

      // 3. Redirect to /login/
      if (rrhAuth.options.loginRoute != null)
        yield put(push(rrhAuth.options.loginRoute))
    })
  }

  function* loggedInSaga() {
    yield takeEvery(loggedInAction().type, function*(action) {
      if (rrhAuth.options.redirectToOnLoggedIn != null)
        yield put(push(rrhAuth.options.redirectToOnLoggedIn))
    })
  }

  return [listenToLogin, logoutSaga, loggedInSaga, dispatchLogoutOn401]
}
