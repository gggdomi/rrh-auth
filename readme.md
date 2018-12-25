Helper function created for personal use

## Client Side

### Add auth reducer

```js
import { authReducer } from '@gggdomi/rrh-auth'

...

export const rootReducer = history =>
  combineReducers({
    main: mainReducer,
    auth: authReducer,
    ...
  })
```

### Add sagas to the app

Note: takes the login route as a parameter

```js
import rrhSagas from '@gggdomi/rrh/src/sagas'

...

export default [
  ...rrhSagas,
  ...rrhAuthSagas('/login/'),  // login path in react-router 
  // used for redirection if 401 or logout
  moreSagas,
  ...
]
```

### Say which _server-side_ endpoints are used to login

```js
import rrh from '@gggdomi/rrh'

export const postLogin = rrh.new('SUBMIT_LOGIN', '/login/', {
  method: 'POST',
  isLoginRoute: true, // here
})

export const postSignup = rrh.new('SUBMIT_SIGNUP', '/signup/', {
  method: 'POST',
  isLoginRoute: true, // here
})
```

### Listen to loggedInAction to redirect or more

```js
import { logOutAction, loggedInAction } from '@gggdomi/rrh-auth'
import { push } from 'connected-react-router'

export function* loggedInSaga() {
  yield takeEvery(loggedInAction().type, function*(action) {
    yield put(push('/'))
  })
}

export default [
  ...
  loggedInSaga,
  ...
]
```

### Listen to logOutAction to call server side logout or more

```js
import axios from 'axios'
import { BASE_URL_BACK } from 'consts'
import { logOutAction, loggedInAction } from '@gggdomi/rrh-auth'

export function* logOutSaga() {
  yield takeEvery(logOutAction().type, function*(action) {
    yield axios.get(`${BASE_URL_BACK}/logout/`)
  })
}

export default [
  ...
  logOutSaga,
  ...
]
```

### Dispatch logOutAction to log out

```js
import { logOutAction } from '@gggdomi/rrh-auth'

...

const mapDispatchToProps = dispatch => ({
  triggerLogOut: () => {
    dispatch(logOutAction())
  },
})
```

## Server side

### Login endpoint

Params : rrh-auth doesn't care
Returns :
- 401 + `{"msg": "Bad password..."}` if login failed
- 200 + add cookies + `{"access_token": "...."}` if success

### Protected endpoints

Should simply return 401 if not logged in

### Logout endpoint

Just remove cookies or whatever, rrh-auth doesn't care

## TODO

- Breaking: change isLoginRoute to isLoginEndpoint for clarification
- Add params:
    + `redirectToOnLogin`: push if defined ?
    + `logoutEndpoint`: call if defined ? Note: today `isLogoutRoute` has a similar function but is not really used
- JWT, session, cookies, local-storage... configurations
- 401 vs 403 if some ressources are protected but should not lead to disconnection
- Extract error message on 401