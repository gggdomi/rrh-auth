import { put, takeEvery } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import jwtDecode from 'jwt-decode'

import rrhAuth, { loggedInAction, logOutAction } from './'

import { rrhActions, rrhSuccessRegex, rrhFailRegex } from '@gggdomi/rrh'

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

export function* logoutOn401() {
  yield takeEvery(action => action.type.match(rrhFailRegex), function*(action) {
    if (action.error.response && action.error.response.status === 401) {
      yield put(logOutAction())
    }
  })
}

export const makeLogoutSaga = (loginRoute = '/login/') =>
  function* logoutSaga() {
    yield takeEvery(logOutAction().type, function*() {
      localStorage.removeItem('rrh-auth-username')
      localStorage.removeItem('rrh-auth-token')

      const logoutRRHName = Object.keys(rrhActions).find(
        x => rrhActions[x].isLogoutRoute
      )
      const logoutRRH = rrhActions[logoutRRHName]
      if (logoutRRH) yield put(logoutRRH.Start())

      yield put(push(loginRoute))
    })
  }

export default loginRoute => [
  listenToLogin,
  makeLogoutSaga(loginRoute),
  logoutOn401,
]
